import { z } from "zod";
import type { CareerPath, CareerPathDetails } from "@kursa/types";

import { openai } from "../openai.js";
import { CORRECT_PATHS_PROMPT, GENERATE_PATHS_PROMPT, Models } from "./prompts.js";

// A generated path before persistence — no DB id, no activation state yet.
export type GeneratedPath = Omit<CareerPath, "id" | "isActive">;

// Snapshot of the parts of a profile that matter for path generation.
// Built by the caller (paths.service) and serialized into the prompt.
export type PathProfileSnapshot = {
  bio: string | null;
  targetRole: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  careerTrajectory: string | null;
  aspirations: unknown;
  skills: Array<{ name: string; confidenceRating: number | null }>;
  workHistories: Array<{
    roleTitle: string;
    companyName: string;
    startYear: number | null;
    endYear: number | "present" | null;
    outcomes: unknown;
  }>;
  learningGoals: Array<{ skillName: string; status: string }>;
};

const MIN_PATHS = 3;

const milestoneSchema = z.object({
  order: z.number().int(),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMonthsFromNow: z.number().int().nonnegative(),
  salaryBand: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    currency: z.literal("USD"),
  }),
  requiredSkills: z.array(z.string()),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

const pathDetailsSchema = z.object({
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
});

const generatedPathSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  confidenceScore: z.number().min(0).max(1),
  projectedTimelineMonths: z.number().int().positive(),
  details: pathDetailsSchema.optional().nullable(),
  milestones: z.array(milestoneSchema).min(1),
});

const responseSchema = z.object({
  paths: z.array(z.unknown()),
});

/**
 * Generate 3–5 career paths for a user from a profile snapshot.
 *
 * Validates each path against the Zod schema; invalid paths are dropped.
 * If the first attempt yields fewer than MIN_PATHS valid paths, retries once
 * with an explicit correction prompt. Throws if it still cannot produce the
 * minimum, so the caller can fall back to rule-based paths.
 */
export async function generateCareerPaths(
  snapshot: PathProfileSnapshot,
): Promise<GeneratedPath[]> {
  const snapshotJson = JSON.stringify(snapshot);

  let paths = await attempt([
    { role: "system", content: GENERATE_PATHS_PROMPT },
    { role: "user", content: snapshotJson },
  ]);

  if (paths.length < MIN_PATHS) {
    paths = await attempt([
      { role: "system", content: GENERATE_PATHS_PROMPT },
      { role: "user", content: snapshotJson },
      { role: "system", content: CORRECT_PATHS_PROMPT },
    ]);
  }

  if (paths.length < MIN_PATHS) {
    throw new Error(
      `Path generation produced ${paths.length} valid paths (need ${MIN_PATHS})`,
    );
  }

  // Cap at 5 per the contract and normalise milestone order.
  return paths.slice(0, 5).map(normalisePath);
}

async function attempt(
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<GeneratedPath[]> {
  const response = await openai.chat.completions.create({
    model: Models.smart,
    messages,
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const outer = responseSchema.safeParse(parsed);
  if (!outer.success) return [];

  // Validate each path independently; drop the ones that don't conform.
  const valid: GeneratedPath[] = [];
  for (const raw of outer.data.paths) {
    const result = generatedPathSchema.safeParse(raw);
    if (result.success) valid.push(result.data);
  }
  return valid;
}

function normalisePath(path: GeneratedPath): GeneratedPath {
  const milestones = [...path.milestones]
    .sort((a, b) => a.estimatedMonthsFromNow - b.estimatedMonthsFromNow)
    .map((m, i) => ({ ...m, order: i + 1 }));
  return { ...path, details: normaliseDetails(path.details), milestones };
}

function normaliseDetails(details: CareerPathDetails | null | undefined): CareerPathDetails {
  return {
    fitReasons: details?.fitReasons ?? [],
    skillGaps: details?.skillGaps ?? [],
    nextActions: details?.nextActions ?? [],
    risks: details?.risks ?? [],
    evidence: details?.evidence ?? [],
  };
}
