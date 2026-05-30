import { z } from "zod";

export const skillCategorySchema = z.enum(["technical", "soft", "tool"]);
export const workEnvironmentSchema = z.enum(["startup", "corporate", "remote", "hybrid"]);
export const riskAppetiteSchema = z.enum(["stability_seeking", "balanced", "high_growth"]);

export const basicsSchema = z.object({
  targetRole: z.string().trim().min(1),
  location: z.string().trim().min(1),
  yearsOfExperience: z.number().int().min(0).max(80),
  bio: z.string().trim().min(1),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1),
  category: skillCategorySchema,
  confidenceRating: z.number().int().min(1).max(5),
  source: z.enum(["self_reported", "resume"]).optional(),
});

export const workHistorySchema = z.object({
  companyName: z.string().trim().min(1),
  roleTitle: z.string().trim().min(1),
  outcomes: z.string().trim().min(1),
  isCurrent: z.boolean().optional().default(false),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export const educationSchema = z.object({
  type: z.enum(["degree", "certification", "course"]),
  credentialName: z.string().trim().min(1),
  issuer: z.string().trim().min(1),
  completionDate: z.string().nullable().optional(),
});

export const languageSchema = z.object({
  name: z.string().trim().min(1),
  proficiency: z.enum(["Native", "Fluent", "Conversational", "Basic"]),
});

export const socialLinkSchema = z.object({
  platform: z.enum(["github", "linkedin", "twitter", "website", "portfolio"]),
  url: z.string().trim().min(1),
});

export const valuesSchema = z.object({
  workEnvironment: workEnvironmentSchema,
  riskAppetite: riskAppetiteSchema,
  salaryExpectation: z.string().trim().min(1),
  workingStyle: z.string().trim().min(1),
  constraints: z.string().trim().default("None"),
});

export const aspirationsSchema = z.object({
  targetRoles: z.string().trim().min(1),
  targetIndustries: z.string().trim().min(1),
  horizon3y: z.string().trim().min(1),
  horizon5y: z.string().trim().min(1),
  definitionOfSuccess: z.string().trim().min(1),
});

export const importsSchema = z.object({
  resumeFileName: z.string().default(""),
  resumeRawText: z.string().default(""),
  linkedinProfileUrl: z.string().default(""),
});

export const completeOnboardingSchema = z.object({
  basics: basicsSchema,
  skills: z.array(skillSchema).min(1, "Add at least one skill"),
  workHistory: z.array(workHistorySchema).min(1, "Add at least one role"),
  education: z.array(educationSchema).default([]),
  languages: z.array(languageSchema).default([]),
  socialLinks: z.array(socialLinkSchema).default([]),
  values: valuesSchema,
  aspirations: aspirationsSchema,
  imports: importsSchema.default({ resumeFileName: "", resumeRawText: "", linkedinProfileUrl: "" }),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
