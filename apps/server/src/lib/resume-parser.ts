import { z } from "zod";

import { EXTRACT_RESUME_DATA_PROMPT, Models } from "./ai/prompts.js";
import { openai } from "./openai.js";
import { extractSkillsFromTaxonomy } from "./resume-taxonomy.js";
import { normalizeLlmResumePayload } from "./resume-parser-normalize.js";
import {
  llmResponseSchema,
  type ParsedSkill,
  type ResumeParseResult,
} from "../validators/resume-parser.validator.js";

const MAX_RESUME_CHARS = 15_000;

function mergeSkills(
  llmSkills: ParsedSkill[],
  taxonomySkills: ReturnType<typeof extractSkillsFromTaxonomy>,
): ParsedSkill[] {
  const seen = new Map<string, ParsedSkill>();
  for (const s of [...llmSkills, ...taxonomySkills]) {
    const key = s.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || s.confidenceRating > existing.confidenceRating) {
      seen.set(key, s);
    }
  }
  return [...seen.values()].slice(0, 30);
}

export async function parseResumeText(rawText: string): Promise<ResumeParseResult> {
  const base = {
    rawText,
    skills: [] as ParsedSkill[],
    workHistory: [],
    projects: [],
    achievements: [],
    education: [],
    languages: [],
    socialLinks: [],
    basics: { bio: null, location: null },
    warnings: [] as string[],
    extractionMethod: "taxonomy" as const,
  };

  const taxonomySkills = extractSkillsFromTaxonomy(rawText);
  let llmData: z.infer<typeof llmResponseSchema> | null = null;
  let llmError: string | null = null;

  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: EXTRACT_RESUME_DATA_PROMPT },
        { role: "user", content: rawText.slice(0, MAX_RESUME_CHARS) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2_000,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = llmResponseSchema.safeParse(
      normalizeLlmResumePayload(JSON.parse(content)),
    );
    if (parsed.success) {
      llmData = parsed.data;
    } else {
      llmError = "Some resume fields could not be parsed — using partial extraction";
      console.error("[resume-parser] LLM validation failed:", parsed.error.flatten());
    }
  } catch (error) {
    llmError = error instanceof Error ? error.message : "LLM extraction failed";
    console.error("[resume-parser] Extraction failed:", error);
  }

  if (llmData) {
    const skills = mergeSkills(llmData.skills, taxonomySkills);
    const method =
      taxonomySkills.length > 0 && llmData.skills.length > 0 ? "hybrid" : "llm";
    return {
      ...llmData,
      skills,
      rawText,
      extractionMethod: method,
      warnings: llmError ? [llmError] : [],
    };
  }

  if (taxonomySkills.length > 0) {
    return {
      ...base,
      skills: taxonomySkills,
      extractionMethod: "taxonomy",
      warnings: [llmError ?? "Used keyword fallback — AI extraction unavailable"],
    };
  }

  return {
    ...base,
    warnings: [llmError ?? "Could not extract data from resume"],
  };
}

export type { ResumeParseResult };
