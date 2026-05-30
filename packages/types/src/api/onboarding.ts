import { z } from "zod";

export const skillCategorySchema = z.enum(["technical", "soft", "tool"]);
export const workEnvironmentSchema = z.enum(["startup", "corporate", "remote", "hybrid"]);
export const riskAppetiteSchema = z.enum(["stability_seeking", "balanced", "high_growth"]);
export const educationTypeSchema = z.enum(["degree", "certification", "course"]);
export const languageProficiencySchema = z.enum(["Native", "Fluent", "Conversational", "Basic"]);
export const achievementTypeSchema = z.enum([
  "HACKATHON",
  "AWARD",
  "PUBLICATION",
  "SPEAKING",
  "OPEN_SOURCE",
  "VOLUNTEER",
  "OTHER",
]);

export const basicsSchema = z.object({
  targetRole: z.string().trim().min(1, "Tell me the role you're aiming for"),
  location: z.string().trim().min(1, "Where are you based?"),
  yearsOfExperience: z.number().int().min(0).max(80),
  bio: z.string().trim().min(1, "Share a short bio"),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1),
  category: skillCategorySchema,
  confidenceRating: z.number().int().min(1).max(5),
});

export const workHistorySchema = z.object({
  companyName: z.string().trim().min(1, "Company is required"),
  roleTitle: z.string().trim().min(1, "Role is required"),
  outcomes: z.string().trim().min(1, "Share what you did or accomplished"),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  isCurrent: z.boolean().default(false),
});

export const educationSchema = z.object({
  type: educationTypeSchema,
  credentialName: z.string().trim().min(1),
  issuer: z.string().trim().min(1),
  completionDate: z.string().nullable().default(null),
});

export const languageSchema = z.object({
  name: z.string().trim().min(1),
  proficiency: languageProficiencySchema,
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1),
  url: z.string().trim().min(1),
});

export const projectSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  outcomes: z.string().default(""),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
});

export const achievementSchema = z.object({
  type: achievementTypeSchema,
  title: z.string().trim().min(1),
  issuer: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  dateAchieved: z.string().nullable().default(null),
});

export const valuesSchema = z.object({
  workEnvironment: workEnvironmentSchema,
  riskAppetite: riskAppetiteSchema,
  salaryExpectation: z.string().trim().min(1, "Share a target compensation"),
  workingStyle: z.string().trim().min(1, "Describe your working style"),
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

export const onboardingPayloadSchema = z.object({
  basics: basicsSchema,
  skills: z.array(skillSchema).min(1, "Add at least one skill"),
  workHistory: z.array(workHistorySchema).min(1, "Add at least one role"),
  education: z.array(educationSchema).default([]),
  languages: z.array(languageSchema).default([]),
  socialLinks: z.array(socialLinkSchema).default([]),
  projects: z.array(projectSchema).default([]),
  achievements: z.array(achievementSchema).default([]),
  values: valuesSchema,
  aspirations: aspirationsSchema,
  imports: importsSchema.default({
    resumeFileName: "",
    resumeRawText: "",
    linkedinProfileUrl: "",
  }),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type WorkEnvironment = z.infer<typeof workEnvironmentSchema>;
export type RiskAppetite = z.infer<typeof riskAppetiteSchema>;
export type BasicsInput = z.infer<typeof basicsSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type WorkHistoryInput = z.infer<typeof workHistorySchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type LanguageInput = z.infer<typeof languageSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type AchievementInput = z.infer<typeof achievementSchema>;
export type ValuesInput = z.infer<typeof valuesSchema>;
export type AspirationsInput = z.infer<typeof aspirationsSchema>;
export type ImportsInput = z.infer<typeof importsSchema>;
export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;
