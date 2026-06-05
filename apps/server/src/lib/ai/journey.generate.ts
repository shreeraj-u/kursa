import { z } from "zod";
import type {
  CareerJourney,
  CareerJourneyDetails,
  JourneyMilestone,
  JourneyPreferences,
} from "@kursa/types";

import { openai } from "../openai.js";
import {
  CORRECT_EXTEND_JOURNEY_PROMPT,
  CORRECT_JOURNEY_PROMPT,
  EXTEND_JOURNEY_PROMPT,
  EXTRACT_REVISION_BRIEF_PROMPT,
  EXTRACT_SETUP_PREFERENCES_PROMPT,
  GENERATE_JOURNEY_PROMPT,
  REVISE_JOURNEY_PROMPT,
  Models,
} from "./prompts.js";
import type { JourneyRevisionBrief } from "@kursa/types";
import { journeyPreferencesSchema } from "@kursa/types";

// A generated journey before persistence — no DB id, no profileId yet.
export type GeneratedJourney = Omit<CareerJourney, "id" | "profileId">;

// A generated milestone before normalisation (the persisted milestone shape).
export type GeneratedMilestone = {
  order: number;
  title: string;
  description: string;
  whyItMatters?: string;
  successCriteria?: string[];
  proofArtifacts?: string[];
  firstStep?: string;
  estimatedMonthsFromNow: number;
  salaryBand: { min: number; max: number; currency: "USD" };
  requiredSkills: string[];
  status: JourneyMilestone["status"];
};

// Snapshot of the parts of a profile that matter for journey generation.
// Built by the caller (journey.service) and serialized into the prompt.
export type JourneyProfileSnapshot = {
  bio: string | null;
  targetRole: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  careerTrajectory: string | null;
  aspirations: unknown;
  values: unknown;
  journeyPreferences: JourneyPreferences | null;
  skills: Array<{ name: string; confidenceRating: number | null }>;
  workHistories: Array<{
    roleTitle: string;
    companyName: string;
    startYear: number | null;
    endYear: number | "present" | null;
    outcomes: unknown;
  }>;
  learningGoals: Array<{ skillName: string; status: string }>;
  advisorSignals?: {
    winsThisQuarter: number;
    sentimentTrend12w: number | null;
    intentionActionGap: boolean;
    memoryFacts: string[];
  };
  githubSignals?: {
    frameworkSignals: string[];
    activeRepoNames: string[];
    primaryLanguages: string[];
  } | null;
  marketGapSkills?: string[];
};

const milestoneSchema = z.object({
  order: z.number().int(),
  title: z.string().min(1),
  description: z.string().min(1),
  whyItMatters: z.string().min(1).optional().default(""),
  successCriteria: z.array(z.string().min(1)).optional().default([]),
  proofArtifacts: z.array(z.string().min(1)).optional().default([]),
  firstStep: z.string().min(1).optional().default(""),
  estimatedMonthsFromNow: z.number().int().nonnegative(),
  salaryBand: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    currency: z.literal("USD"),
  }),
  requiredSkills: z.array(z.string()),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

const journeyDetailsSchema = z.object({
  strategySummary: z.string().min(1).optional().default(""),
  fitReasons: z.array(z.string().min(1)).default([]),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().min(1),
        whyItMatters: z.string().min(1),
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .default([]),
  nextActions: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        timeframe: z.string().min(1),
      }),
    )
    .default([]),
  risks: z
    .array(
      z.object({
        risk: z.string().min(1),
        mitigation: z.string().min(1),
      }),
    )
    .default([]),
  evidence: z.array(z.string().min(1)).default([]),
  assumptions: z.array(z.string().min(1)).optional().default([]),
  tradeoffs: z.array(z.string().min(1)).optional().default([]),
  confidenceFactors: z.array(z.string().min(1)).optional().default([]),
});

const generatedJourneySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  confidenceScore: z.number().min(0).max(1),
  projectedTimelineMonths: z.number().int().positive(),
  details: journeyDetailsSchema.optional().nullable(),
  milestones: z.array(milestoneSchema).min(1),
});

const journeyResponseSchema = z.object({
  journey: z.unknown(),
});

const extendResponseSchema = z.object({
  milestones: z.array(z.unknown()),
});

const MIN_EXTEND_MILESTONES = 3;

/**
 * Generate a single best-fit career journey for a user from a profile snapshot.
 *
 * Validates the journey against the Zod schema. If the first attempt fails to
 * produce a valid journey, retries once with an explicit correction prompt.
 * Throws if it still cannot, so the caller can fall back to a rule-based journey.
 */
export async function generateCareerJourney(
  snapshot: JourneyProfileSnapshot,
): Promise<GeneratedJourney> {
  const snapshotJson = JSON.stringify(snapshot);

  let journey = await attemptJourney([
    { role: "system", content: GENERATE_JOURNEY_PROMPT },
    { role: "user", content: snapshotJson },
  ]);

  if (!journey) {
    journey = await attemptJourney([
      { role: "system", content: GENERATE_JOURNEY_PROMPT },
      { role: "user", content: snapshotJson },
      { role: "system", content: CORRECT_JOURNEY_PROMPT },
    ]);
  }

  if (!journey) {
    throw new Error("Journey generation produced no valid journey");
  }

  return normaliseJourney(journey);
}

/**
 * Generate continuation milestones for a journey whose milestones are all
 * completed. Returns the new milestones (un-renumbered); the caller appends and
 * re-numbers them. Throws if it cannot produce the minimum, so the caller can skip.
 */
export async function extendCareerJourney(
  snapshot: JourneyProfileSnapshot,
  completed: { title: string; description: string; milestones: JourneyMilestone[] },
): Promise<GeneratedMilestone[]> {
  const payload = JSON.stringify({
    profile: snapshot,
    completedJourney: {
      title: completed.title,
      description: completed.description,
      milestones: completed.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        estimatedMonthsFromNow: m.estimatedMonthsFromNow,
        requiredSkills: m.requiredSkills,
      })),
    },
  });

  let milestones = await attemptExtend([
    { role: "system", content: EXTEND_JOURNEY_PROMPT },
    { role: "user", content: payload },
  ]);

  if (milestones.length < MIN_EXTEND_MILESTONES) {
    milestones = await attemptExtend([
      { role: "system", content: EXTEND_JOURNEY_PROMPT },
      { role: "user", content: payload },
      { role: "system", content: CORRECT_EXTEND_JOURNEY_PROMPT },
    ]);
  }

  if (milestones.length < MIN_EXTEND_MILESTONES) {
    throw new Error(
      `Journey extension produced ${milestones.length} valid milestones (need ${MIN_EXTEND_MILESTONES})`,
    );
  }

  return milestones;
}

async function attemptJourney(
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<GeneratedJourney | null> {
  const parsed = await callJson(messages);
  if (!parsed) return null;

  const outer = journeyResponseSchema.safeParse(parsed);
  if (!outer.success) return null;

  const result = generatedJourneySchema.safeParse(outer.data.journey);
  return result.success ? result.data : null;
}

async function attemptExtend(
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<GeneratedMilestone[]> {
  const parsed = await callJson(messages);
  if (!parsed) return [];

  const outer = extendResponseSchema.safeParse(parsed);
  if (!outer.success) return [];

  const valid: GeneratedMilestone[] = [];
  for (const raw of outer.data.milestones) {
    const result = milestoneSchema.safeParse(raw);
    if (result.success) valid.push(result.data);
  }
  return valid;
}

async function callJson(
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<unknown | null> {
  const response = await openai.chat.completions.create({
    model: Models.smart,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function normaliseJourney(journey: GeneratedJourney): GeneratedJourney {
  const milestones = [...journey.milestones]
    .sort((a, b) => a.estimatedMonthsFromNow - b.estimatedMonthsFromNow)
    .map((m, i) => ({
      ...m,
      order: i + 1,
      whyItMatters: m.whyItMatters ?? "",
      successCriteria: m.successCriteria ?? [],
      proofArtifacts: m.proofArtifacts ?? [],
      firstStep: m.firstStep ?? "",
    }));
  return { ...journey, details: normaliseDetails(journey.details), milestones };
}

function normaliseDetails(
  details: CareerJourneyDetails | null | undefined,
): CareerJourneyDetails {
  return {
    strategySummary: details?.strategySummary ?? "",
    fitReasons: details?.fitReasons ?? [],
    skillGaps: details?.skillGaps ?? [],
    nextActions: details?.nextActions ?? [],
    risks: details?.risks ?? [],
    evidence: details?.evidence ?? [],
    assumptions: details?.assumptions ?? [],
    tradeoffs: details?.tradeoffs ?? [],
    confidenceFactors: details?.confidenceFactors ?? [],
  };
}

export function buildWelcomeSummary(journey: GeneratedJourney & { id?: string }): string {
  const current =
    journey.milestones.find((m) => m.status === "in_progress") ??
    journey.milestones.find((m) => m.status !== "completed") ??
    journey.milestones[0];
  const strategy = journey.details?.strategySummary || journey.description;
  const firstStep = current?.firstStep || current?.description;
  const parts = [
    `Your path focuses on ${journey.title}.`,
    strategy.length > 220 ? `${strategy.slice(0, 217)}…` : strategy,
  ];
  if (current && firstStep) {
    parts.push(`Start with ${current.title}: ${firstStep}`);
  }
  return parts.join(" ");
}

const revisionBriefSchema = z.object({
  summary: z.string().min(1),
  changeScope: z.enum(["journey_meta", "milestones_partial", "full_rebuild"]),
  journeyPatches: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      projectedTimelineMonths: z.number().int().positive().optional(),
      details: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  milestonePatches: z
    .array(
      z.object({
        order: z.number().int(),
        action: z.enum(["update", "replace", "insert_after", "remove"]),
        patch: z.record(z.string(), z.unknown()).optional(),
        replacement: milestoneSchema.partial().optional(),
      }),
    )
    .optional(),
  preferenceUpdates: z.record(z.string(), z.unknown()).optional(),
  preserveCompleted: z.boolean().default(true),
  preserveManuallySet: z.boolean().default(true),
});

export async function extractSetupPreferences(
  messages: Array<{ role: string; content: string }>,
  baseline?: JourneyPreferences,
): Promise<JourneyPreferences | null> {
  const payload = JSON.stringify({ baseline: baseline ?? null, messages: messages.slice(-16) });
  const parsed = await callJson([
    { role: "system", content: EXTRACT_SETUP_PREFERENCES_PROMPT },
    { role: "user", content: payload },
  ]);
  if (!parsed) return null;
  const merged = {
    ...(baseline ?? journeyPreferencesSchema.parse({})),
    ...(typeof parsed === "object" && parsed !== null ? parsed : {}),
  };
  const result = journeyPreferencesSchema.safeParse(merged);
  return result.success ? result.data : null;
}

export async function extractRevisionBrief(
  messages: Array<{ role: string; content: string }>,
  journey: CareerJourney,
): Promise<JourneyRevisionBrief | null> {
  const payload = JSON.stringify({ journey, messages: messages.slice(-12) });
  const parsed = await callJson([
    { role: "system", content: EXTRACT_REVISION_BRIEF_PROMPT },
    { role: "user", content: payload },
  ]);
  if (!parsed) return null;
  const result = revisionBriefSchema.safeParse(parsed);
  return result.success ? (result.data as JourneyRevisionBrief) : null;
}

export async function reviseCareerJourney(
  snapshot: JourneyProfileSnapshot,
  current: CareerJourney,
  brief: JourneyRevisionBrief,
): Promise<GeneratedJourney | null> {
  const payload = JSON.stringify({ profile: snapshot, currentJourney: current, brief });
  const parsed = await callJson([
    { role: "system", content: REVISE_JOURNEY_PROMPT },
    { role: "user", content: payload },
  ]);
  if (!parsed) return null;

  const outer = journeyResponseSchema.safeParse(parsed);
  if (!outer.success) return null;

  const result = generatedJourneySchema.safeParse(outer.data.journey);
  return result.success ? normaliseJourney(result.data) : null;
}
