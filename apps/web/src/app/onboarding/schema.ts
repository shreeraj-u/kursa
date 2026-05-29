import { z } from "zod";

export const skillCategorySchema = z.enum(["technical", "soft", "tool"]);
export const workEnvironmentSchema = z.enum(["startup", "corporate", "remote", "hybrid"]);
export const riskAppetiteSchema = z.enum(["stability_seeking", "balanced", "high_growth"]);

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
export type ValuesInput = z.infer<typeof valuesSchema>;
export type AspirationsInput = z.infer<typeof aspirationsSchema>;
export type ImportsInput = z.infer<typeof importsSchema>;
export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;
