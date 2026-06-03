import { z } from "zod";

const parsedSkillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["technical", "soft", "tool"]),
  confidenceRating: z.number().int().min(1).max(5),
});

const parsedWorkHistorySchema = z.object({
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  outcomes: z.string().default(""),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  isCurrent: z.boolean().default(false),
});

const parsedProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  outcomes: z.string().default(""),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
});

const parsedAchievementSchema = z.object({
  type: z.enum([
    "HACKATHON",
    "AWARD",
    "PUBLICATION",
    "SPEAKING",
    "OPEN_SOURCE",
    "VOLUNTEER",
    "OTHER",
  ]),
  title: z.string().min(1),
  issuer: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  dateAchieved: z.string().nullable().default(null),
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

export const llmResponseSchema = z.object({
  skills: z.array(parsedSkillSchema).max(30).default([]),
  workHistory: z.array(parsedWorkHistorySchema).max(10).default([]),
  projects: z.array(parsedProjectSchema).max(8).default([]),
  achievements: z.array(parsedAchievementSchema).max(10).default([]),
  education: z.array(parsedEducationSchema).max(5).default([]),
  languages: z.array(parsedLanguageSchema).max(5).default([]),
  socialLinks: z.array(parsedSocialLinkSchema).max(4).default([]),
  basics: parsedBasicsSchema.default({ bio: null, location: null }),
});

export type ParsedSkill = z.infer<typeof parsedSkillSchema>;
export type ResumeParseResult = z.infer<typeof llmResponseSchema> & {
  rawText: string;
  extractionMethod: "llm" | "taxonomy" | "hybrid";
  warnings: string[];
};
