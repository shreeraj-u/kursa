import type {
  AtsIssue,
  ResumeContent,
  ResumeProfileSnapshot,
  ResumeTargetContext,
} from "@kursa/types";

import { openai } from "../openai.js";
import {
  MAX_BULLETS,
  MAX_ROLES,
  MAX_SKILLS,
  atsResponseSchema,
  resumeContentSchema,
} from "../../validators/resume.validator.js";
import {
  CORRECT_RESUME_PROMPT,
  GENERATE_RESUME_PROMPT,
  Models,
  SCORE_ATS_PROMPT,
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
    max_tokens: 2500, // output bound
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
  };
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
