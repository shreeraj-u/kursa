import type {
  AtsIssue,
  ResumeContent,
  ResumeProfileSnapshot,
  ResumeTargetContext,
} from "@kursa/types";

import { openai } from "../openai.js";
import {
  MAX_ACHIEVEMENTS,
  MAX_BULLETS,
  MAX_PROJECTS,
  MAX_ROLES,
  MAX_SKILLS,
  atsResponseSchema,
  resumeContentSchema,
} from "../../validators/resume.validator.js";
import {
  CORRECT_RESUME_PROMPT,
  CORRECT_IMPROVE_ATS_PROMPT,
  GENERATE_RESUME_PROMPT,
  Models,
  SCORE_ATS_PROMPT,
  IMPROVE_RESUME_ATS_PROMPT,
} from "./prompts.js";


/**
 * Generate a single resume from a profile snapshot, shaped toward the target
 * context. Validates against the Zod schema; retries once with a correction
 * prompt on malformed output; throws if it still fails so the caller surfaces
 * an error rather than persisting garbage.
 */
export async function generateResume(
  snapshot: ResumeProfileSnapshot,
  target: ResumeTargetContext,
): Promise<ResumeContent> {
  const userContent = JSON.stringify({ profile: snapshot, target });

  let content = await attemptResume([
    { role: "system", content: GENERATE_RESUME_PROMPT },
    { role: "user", content: userContent },
  ]);

  if (!content) {
    content = await attemptResume([
      { role: "system", content: GENERATE_RESUME_PROMPT },
      { role: "user", content: userContent },
      { role: "system", content: CORRECT_RESUME_PROMPT },
    ]);
  }

  if (!content) {
    throw new Error("Resume generation failed validation after retry");
  }

  return content;
}

async function attemptResume(
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<ResumeContent | null> {
  const response = await openai.chat.completions.create({
    model: Models.smart,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 4000, // output bound — headroom so full project/experience depth isn't truncated
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = resumeContentSchema.safeParse(parsed);
  if (!result.success) return null;

  // Enforce caps defensively (schema bounds arrays; trim roles too).
  const data = result.data;
  return {
    ...data,
    experience: data.experience
      .slice(0, MAX_ROLES)
      .map((e) => ({ ...e, bullets: e.bullets.slice(0, MAX_BULLETS) })),
    skills: data.skills.slice(0, MAX_SKILLS),
    projects: data.projects
      ?.filter((p) => p.description.trim().length > 0 || (p.bullets?.length ?? 0) > 0)
      .slice(0, MAX_PROJECTS)
      .map((p) => ({ ...p, bullets: p.bullets?.slice(0, 3) })),
    achievements: data.achievements?.slice(0, MAX_ACHIEVEMENTS),
    sectionOrder: data.sectionOrder ?? ["summary", "skills", "experience", "projects", "others", "education", "certifications"],
  };
}

/**
 * Produces a reviewable, truth-preserving draft that applies the current ATS
 * issues. The caller persists only after the user reviews and saves it.
 */
export async function improveResumeForAts(
  content: ResumeContent,
  atsIssues: AtsIssue[],
  target: ResumeTargetContext,
  snapshot: ResumeProfileSnapshot,
): Promise<ResumeContent> {
  const userContent = JSON.stringify({ resume: content, atsIssues, target, profile: snapshot });

  let draft = await attemptImprovedResume(userContent);
  if (!draft) draft = await attemptImprovedResume(userContent, true);
  if (!draft) throw new Error("ATS improvement failed validation after retry");

  return draft;
}

async function attemptImprovedResume(
  userContent: string,
  correction = false,
): Promise<ResumeContent | null> {
  let response;
  try {
    response = await openai.chat.completions.create({
      model: Models.smart,
      messages: [
        { role: "system", content: IMPROVE_RESUME_ATS_PROMPT },
        { role: "user", content: userContent },
        ...(correction
          ? [{ role: "system" as const, content: CORRECT_IMPROVE_ATS_PROMPT }]
          : []),
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
      max_tokens: 4000,
    });
  } catch (err) {
    console.error("[improveAts] OpenAI call threw:", err);
    return null;
  }

  const raw = response.choices[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const raw_candidate =
    parsed && typeof parsed === "object" && "resume" in parsed
      ? (parsed as { resume?: unknown }).resume
      : parsed;
  const candidate = sanitizeResumeCandidate(raw_candidate);
  const result = resumeContentSchema.safeParse(candidate);
  if (!result.success) return null;

  const data = result.data;
  return {
    ...data,
    experience: data.experience
      .slice(0, MAX_ROLES)
      .map((e) => ({ ...e, bullets: e.bullets.slice(0, MAX_BULLETS) })),
    skills: data.skills.slice(0, MAX_SKILLS),
    projects: data.projects
      ?.filter((p) => p.description.trim().length > 0 || (p.bullets?.length ?? 0) > 0)
      .slice(0, MAX_PROJECTS)
      .map((p) => ({ ...p, bullets: p.bullets?.slice(0, 3) })),
    achievements: data.achievements?.slice(0, MAX_ACHIEVEMENTS),
    sectionOrder: data.sectionOrder ?? ["summary", "skills", "experience", "projects", "others", "education", "certifications"],
  };
}

const VALID_SECTION_KEYS = new Set([
  "summary", "experience", "skills", "education", "certifications", "projects", "others",
]);

function sanitizeResumeCandidate(candidate: unknown): unknown {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return candidate;
  const c = { ...(candidate as Record<string, unknown>) };

  // Trim skills to schema cap (AI frequently returns more than MAX_SKILLS)
  if (Array.isArray(c.skills)) {
    c.skills = c.skills.slice(0, MAX_SKILLS);
  }

  // Fix sectionOrder: replace "achievements" -> "others", drop unknown keys
  if (Array.isArray(c.sectionOrder)) {
    c.sectionOrder = c.sectionOrder
      .map((k: unknown) => (k === "achievements" ? "others" : k))
      .filter((k: unknown) => typeof k === "string" && VALID_SECTION_KEYS.has(k));
  }

  // Filter empty bullets from experience entries
  if (Array.isArray(c.experience)) {
    c.experience = c.experience.map((entry: unknown) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
      const e = { ...(entry as Record<string, unknown>) };
      if (Array.isArray(e.bullets)) {
        e.bullets = e.bullets.filter((b: unknown) => typeof b === "string" && b.trim().length > 0);
      }
      return e;
    });
  }

  // Filter empty bullets from project entries
  if (Array.isArray(c.projects)) {
    c.projects = c.projects.map((proj: unknown) => {
      if (!proj || typeof proj !== "object" || Array.isArray(proj)) return proj;
      const p = { ...(proj as Record<string, unknown>) };
      if (Array.isArray(p.bullets)) {
        p.bullets = p.bullets.filter((b: unknown) => typeof b === "string" && b.trim().length > 0);
      }
      return p;
    });
  }

  return c;
}

/**
 * Score a generated resume against ATS criteria. On any failure returns a
 * neutral fallback so resume generation still succeeds (the score is secondary
 * to producing the resume).
 */
export async function scoreAts(
  content: ResumeContent,
  target: ResumeTargetContext,
): Promise<{ atsScore: number; atsIssues: AtsIssue[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: SCORE_ATS_PROMPT },
        { role: "user", content: JSON.stringify({ resume: content, target }) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 700, 
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const result = atsResponseSchema.safeParse(JSON.parse(raw));
    if (!result.success) return neutralAts();

    return { atsScore: Math.round(result.data.atsScore), atsIssues: result.data.issues };
  } catch {
    return neutralAts();
  }
}

function neutralAts(): { atsScore: number; atsIssues: AtsIssue[] } {
  return { atsScore: 70, atsIssues: [] };
}
