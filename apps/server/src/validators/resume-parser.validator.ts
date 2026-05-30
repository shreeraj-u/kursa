import { z } from "zod";

export const parsedSkillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["technical", "soft", "tool"]),
  confidenceRating: z.number().int().min(1).max(5),
});

export const parsedWorkHistorySchema = z.object({
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  outcomes: z.string().default(""),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  isCurrent: z.boolean().default(false),
});

export const parsedProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  outcomes: z.string().default(""),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
});

export const parsedAchievementSchema = z.object({
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

export const parsedEducationSchema = z.object({
  type: z.enum(["degree", "certification", "course"]),
  credentialName: z.string().min(1),
  issuer: z.string().min(1),
  completionDate: z.string().nullable().default(null),
});

export const parsedLanguageSchema = z.object({
  name: z.string().min(1),
  proficiency: z.enum(["Native", "Fluent", "Conversational", "Basic"]),
});

export const parsedSocialLinkSchema = z.object({
  platform: z.enum(["github", "linkedin", "twitter", "website", "portfolio"]),
  url: z.string().min(1),
});

export const parsedBasicsSchema = z.object({
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
export type ParsedWorkHistory = z.infer<typeof parsedWorkHistorySchema>;
export type ParsedProject = z.infer<typeof parsedProjectSchema>;
export type ParsedAchievement = z.infer<typeof parsedAchievementSchema>;
export type ParsedEducation = z.infer<typeof parsedEducationSchema>;
export type ParsedLanguage = z.infer<typeof parsedLanguageSchema>;
export type ParsedSocialLink = z.infer<typeof parsedSocialLinkSchema>;
export type ParsedBasics = z.infer<typeof parsedBasicsSchema>;
export type ResumeParseResult = z.infer<typeof llmResponseSchema> & { rawText: string };
