import { EXTRACT_RESUME_DATA_PROMPT, Models } from "./ai/prompts.js";
import { openai } from "./openai.js";
import {
  llmResponseSchema,
  type ResumeParseResult,
} from "../validators/resume-parser.validator.js";

const MAX_RESUME_CHARS = 15_000;

export async function parseResumeText(rawText: string): Promise<ResumeParseResult> {
  const empty: ResumeParseResult = {
    rawText,
    skills: [],
    workHistory: [],
    projects: [],
    achievements: [],
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
