import { z } from "zod";
import {
  onboardingPayloadSchema,
  onboardingReviewIssueSchema,
  type OnboardingPayload,
  type OnboardingReviewIssue,
  type OnboardingReviewResponse,
} from "@kursa/types";

import { Models, PROFILE_INTAKE_REVIEW_PROMPT, CORRECT_PROFILE_INTAKE_REVIEW_PROMPT } from "./ai/prompts.js";
import {
  looseReviewResponseSchema,
  type LooseReviewIssue,
  type LooseReviewResponse,
} from "../validators/onboarding.validator.js";

const AI_REVIEW_TIMEOUT_MS = 8_000;
const INJECTION_PATTERN = /\b(ignore|disregard|override|forget)\b.{0,80}\b(instruction|prompt|system|developer|policy|rules?)\b/i;

function issueId(prefix: string, path: string): string {
  return `${prefix}-${path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`.slice(0, 120);
}

function makeIssue(params: Omit<OnboardingReviewIssue, "id"> & { id?: string }): OnboardingReviewIssue {
  return {
    id: params.id ?? issueId(params.category, params.path),
    severity: params.severity,
    category: params.category,
    path: params.path,
    message: params.message,
    ...(params.proposedValue !== undefined ? { proposedValue: params.proposedValue } : {}),
  };
}

function coerceLooseIssue(issue: LooseReviewIssue): OnboardingReviewIssue {
  return makeIssue({
    id: issue.id,
    severity: issue.severity,
    category: issue.category,
    path: issue.path,
    message: issue.message,
    ...(issue.proposedValue !== undefined ? { proposedValue: issue.proposedValue } : {}),
  });
}

function coerceLooseReview(review: LooseReviewResponse): OnboardingReviewResponse {
  return {
    status: review.status === "blocked" ? "needs_user_review" : review.status,
    criticalIssues: review.criticalIssues.map(coerceLooseIssue),
    warnings: review.warnings.map(coerceLooseIssue),
    suggestions: review.suggestions.map(coerceLooseIssue),
  };
}

function pathToString(path: PropertyKey[]): string {
  return path.map(String).join(".") || "payload";
}

function statusFor(warnings: OnboardingReviewIssue[], suggestions: OnboardingReviewIssue[]): OnboardingReviewResponse["status"] {
  if (warnings.length > 0 || suggestions.length > 0) return "needs_user_review";
  return "ready";
}

function normalizeReview(review: Omit<OnboardingReviewResponse, "status">): OnboardingReviewResponse {
  const demotedCriticalIssues = review.criticalIssues.map((issue) => ({
    ...issue,
    severity: "warning" as const,
    message: issue.message.replace(/before saving|must fix|blocked/gi, "").trim() || issue.message,
  }));
  const warnings = [...demotedCriticalIssues, ...review.warnings].map((issue) => ({ ...issue, severity: "warning" as const }));
  const suggestions = review.suggestions.map((issue) => ({ ...issue, severity: "suggestion" as const }));
  return {
    status: statusFor(warnings, suggestions),
    criticalIssues: [],
    warnings,
    suggestions,
  };
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((target, segment) => {
    if (target === null || typeof target !== "object") return undefined;
    return (target as Record<string, unknown>)[segment];
  }, source);
}

function setPathValue(target: unknown, path: string, value: unknown): boolean {
  const segments = path.split(".");
  if (segments.length < 2 || target === null || typeof target !== "object") return false;

  let cursor = target as Record<string, unknown>;
  for (const segment of segments.slice(0, -1)) {
    const next = cursor[segment];
    if (next === null || typeof next !== "object") return false;
    cursor = next as Record<string, unknown>;
  }

  const leaf = segments.at(-1);
  if (!leaf) return false;
  cursor[leaf] = value;
  return true;
}

export function sanitizeReviewProposedValue(payload: OnboardingPayload, path: string, proposedValue: unknown): unknown | undefined {
  const pathAllowed = onboardingReviewIssueSchema.safeParse({
    id: "proposal-check",
    severity: "suggestion",
    category: "quality",
    path,
    message: "Validate proposed value.",
    proposedValue,
  });
  if (!pathAllowed.success) return undefined;

  const candidate = structuredClone(payload) as OnboardingPayload;
  if (!setPathValue(candidate, path, proposedValue)) return undefined;

  const parsed = onboardingPayloadSchema.safeParse(candidate);
  if (!parsed.success) return undefined;
  return getPathValue(parsed.data, path);
}

function sanitizeIssueProposedValues(payload: OnboardingPayload, issues: OnboardingReviewIssue[]): OnboardingReviewIssue[] {
  return issues.map((issue) => {
    if (issue.proposedValue === undefined) return issue;
    const proposedValue = sanitizeReviewProposedValue(payload, issue.path, issue.proposedValue);
    if (proposedValue === undefined) {
      const { proposedValue: _drop, ...withoutProposedValue } = issue;
      return withoutProposedValue;
    }
    return { ...issue, proposedValue };
  });
}

function sanitizeReview(payload: OnboardingPayload, review: OnboardingReviewResponse): OnboardingReviewResponse {
  return normalizeReview({
    criticalIssues: sanitizeIssueProposedValues(payload, review.criticalIssues),
    warnings: sanitizeIssueProposedValues(payload, review.warnings),
    suggestions: sanitizeIssueProposedValues(payload, review.suggestions),
  });
}

export function deterministicOnboardingReview(input: unknown): OnboardingReviewResponse {
  const parsed = onboardingPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const warnings = parsed.error.issues.map((issue) => makeIssue({
      severity: "warning",
      category: "validation",
      path: pathToString(issue.path),
      message: issue.message,
    }));
    return normalizeReview({ criticalIssues: [], warnings, suggestions: [] });
  }

  const payload = parsed.data;
  const criticalIssues: OnboardingReviewIssue[] = [];
  const warnings: OnboardingReviewIssue[] = [];
  const suggestions: OnboardingReviewIssue[] = [];

  collectSafetyWarnings(payload, warnings);
  collectCompletenessSuggestions(payload, suggestions, warnings);
  collectConsistencyWarnings(payload, warnings);

  return normalizeReview({ criticalIssues, warnings, suggestions });
}

function collectSafetyWarnings(payload: OnboardingPayload, warnings: OnboardingReviewIssue[]): void {
  const textFields: Array<[string, string | null | undefined]> = [
    ["basics.targetRole", payload.basics.targetRole],
    ["basics.location", payload.basics.location],
    ["basics.bio", payload.basics.bio],
    ["values.salaryExpectation", payload.values.salaryExpectation],
    ["values.workingStyle", payload.values.workingStyle],
    ["values.constraints", payload.values.constraints],
    ["aspirations.targetRoles", payload.aspirations.targetRoles],
    ["aspirations.targetIndustries", payload.aspirations.targetIndustries],
    ["aspirations.horizon3y", payload.aspirations.horizon3y],
    ["aspirations.horizon5y", payload.aspirations.horizon5y],
    ["aspirations.definitionOfSuccess", payload.aspirations.definitionOfSuccess],
    ...payload.workHistory.map((item, index): [string, string] => [`workHistory.${index}.outcomes`, item.outcomes]),
    ...payload.projects.flatMap((item, index): Array<[string, string | null | undefined]> => [
      [`projects.${index}.description`, item.description],
      [`projects.${index}.outcomes`, item.outcomes],
    ]),
    ...payload.achievements.map((item, index): [string, string | null | undefined] => [`achievements.${index}.description`, item.description]),
  ];

  for (const [path, value] of textFields) {
    if (value && INJECTION_PATTERN.test(value)) {
      warnings.push(makeIssue({
        severity: "warning",
        category: "safety",
        path,
        message: "This field looks like it may contain prompt instructions. Remove instructions and keep only profile facts.",
      }));
    }
  }
}

function collectCompletenessSuggestions(payload: OnboardingPayload, suggestions: OnboardingReviewIssue[], warnings: OnboardingReviewIssue[]): void {
  if (payload.basics.bio.length < 40) {
    suggestions.push(makeIssue({
      severity: "suggestion",
      category: "completeness",
      path: "basics.bio",
      message: "Add a little more context about your specialty, seniority, and strongest domain.",
    }));
  }

  payload.workHistory.forEach((item, index) => {
    if (item.outcomes.length < 50) {
      suggestions.push(makeIssue({
        severity: "suggestion",
        category: "quality",
        path: `workHistory.${index}.outcomes`,
        message: "Add concrete scope, tools, or impact for this role so the profile is not too thin.",
      }));
    }
    if (item.isCurrent && item.endDate) {
      warnings.push(makeIssue({
        severity: "warning",
        category: "consistency",
        path: `workHistory.${index}.endDate`,
        message: "This role is marked current but also has an end year. Clear one of those values.",
      }));
    }
  });

  payload.projects.forEach((item, index) => {
    if (!item.description && !item.outcomes) {
      suggestions.push(makeIssue({
        severity: "suggestion",
        category: "completeness",
        path: `projects.${index}.description`,
        message: "Add a one-sentence description or outcome before featuring this project.",
      }));
    }
  });

  if (payload.socialLinks.length === 0 && !payload.imports.linkedinProfileUrl) {
    suggestions.push(makeIssue({
      severity: "suggestion",
      category: "completeness",
      path: "socialLinks",
      message: "Add at least one professional link if you want recruiters to verify your work quickly.",
    }));
  }
}

function collectConsistencyWarnings(payload: OnboardingPayload, warnings: OnboardingReviewIssue[]): void {
  const currentRoles = payload.workHistory.filter((item) => item.isCurrent);
  if (currentRoles.length > 2) {
    warnings.push(makeIssue({
      severity: "warning",
      category: "consistency",
      path: "workHistory",
      message: "More than two roles are marked current. Confirm this is accurate.",
    }));
  }
}

async function runAiReview(payload: OnboardingPayload): Promise<OnboardingReviewResponse | null> {
  const { openai } = await import("./openai.js");
  const baseMessages = [
    { role: "system" as const, content: PROFILE_INTAKE_REVIEW_PROMPT },
    { role: "user" as const, content: JSON.stringify(payload) },
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const messages = attempt === 0
      ? baseMessages
      : [...baseMessages, { role: "system" as const, content: CORRECT_PROFILE_INTAKE_REVIEW_PROMPT }];

    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1_500,
    }, { timeout: AI_REVIEW_TIMEOUT_MS });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsedJson = JSON.parse(content) as unknown;
    const parsed = looseReviewResponseSchema.safeParse(parsedJson);
    if (parsed.success) {
      return sanitizeReview(payload, coerceLooseReview(parsed.data));
    }
    console.error("[onboarding-review] AI review failed validation:", z.flattenError(parsed.error));
  }

  return null;
}

function mergeReview(base: OnboardingReviewResponse, ai: OnboardingReviewResponse | null): OnboardingReviewResponse {
  if (!ai) return base;

  const seen = new Set<string>();
  const dedupe = (issues: OnboardingReviewIssue[]) => issues.filter((issue) => {
    const key = `${issue.severity}:${issue.category}:${issue.path}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const criticalIssues = dedupe([...base.criticalIssues, ...ai.criticalIssues]);
  const warnings = dedupe([...base.warnings, ...ai.warnings]);
  const suggestions = dedupe([...base.suggestions, ...ai.suggestions]);
  return normalizeReview({ criticalIssues, warnings, suggestions });
}

export async function reviewOnboardingDraft(input: unknown): Promise<OnboardingReviewResponse> {
  const deterministic = deterministicOnboardingReview(input);

  const parsed = onboardingPayloadSchema.safeParse(input);
  if (!parsed.success) return deterministic;

  try {
    const ai = await runAiReview(parsed.data);
    return mergeReview(deterministic, ai);
  } catch (error) {
    console.error("[onboarding-review] AI review unavailable; using deterministic review:", error);
    return deterministic;
  }
}
