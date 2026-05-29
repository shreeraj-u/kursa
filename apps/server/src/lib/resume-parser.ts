import { z } from "zod";

import { EXTRACT_RESUME_DATA_PROMPT, Models } from "./ai/prompts.js";
import { openai } from "./openai.js";

const parsedSkillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["technical", "soft", "tool"]),
  confidenceRating: z.number().int().min(1).max(5),
});

const parsedWorkHistorySchema = z.object({
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  outcomes: z.string().default(""),
  isCurrent: z.boolean().default(false),
});

const parsedEducationSchema = z.object({
  type: z.enum(["degree", "certification", "course"]),
  credentialName: z.string().min(1),
  issuer: z.string().min(1),
  completionDate: z.string().nullable().default(null),
});

const parsedLanguageSchema = z.object({
  name: z.string().min(1),
  proficiency: z.enum(["Native", "Fluent", "Conversational", "Basic"]),
});

const parsedSocialLinkSchema = z.object({
  platform: z.enum(["github", "linkedin", "twitter", "website", "portfolio"]),
  url: z.string().min(1),
});

const parsedBasicsSchema = z.object({
  bio: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
});

const llmResponseSchema = z.object({
  skills: z.array(parsedSkillSchema).max(30).default([]),
  workHistory: z.array(parsedWorkHistorySchema).max(10).default([]),
  education: z.array(parsedEducationSchema).max(5).default([]),
  languages: z.array(parsedLanguageSchema).max(5).default([]),
  socialLinks: z.array(parsedSocialLinkSchema).max(4).default([]),
  basics: parsedBasicsSchema.default({ bio: null, location: null }),
});

export type ParsedSkill = z.infer<typeof parsedSkillSchema>;
export type ParsedWorkHistory = z.infer<typeof parsedWorkHistorySchema>;
export type ParsedEducation = z.infer<typeof parsedEducationSchema>;
export type ParsedLanguage = z.infer<typeof parsedLanguageSchema>;
export type ParsedSocialLink = z.infer<typeof parsedSocialLinkSchema>;
export type ParsedBasics = z.infer<typeof parsedBasicsSchema>;
export type ResumeParseResult = z.infer<typeof llmResponseSchema> & { rawText: string };

const MAX_RESUME_CHARS = 15_000;

export async function parseResumeText(rawText: string): Promise<ResumeParseResult> {
  const empty: ResumeParseResult = {
    rawText,
    skills: [],
    workHistory: [],
    education: [],
    languages: [],
    socialLinks: [],
    basics: { bio: null, location: null },
  };

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
    const parsed = llmResponseSchema.safeParse(JSON.parse(content));

    if (!parsed.success) {
      console.error("[resume-parser] LLM response failed validation:", parsed.error.flatten());
      return empty;
    }

    return { ...parsed.data, rawText };
  } catch (error) {
    console.error("[resume-parser] Extraction failed:", error);
    return empty;
  }
}
