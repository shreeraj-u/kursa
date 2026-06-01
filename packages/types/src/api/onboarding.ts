import { z } from "zod";
import { skillCategorySchema } from "./skills";

export { skillCategorySchema };
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

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const MAX_FUTURE_YEAR = CURRENT_YEAR + 10;

const boundedText = (max: number, message?: string) =>
  z.string().trim().min(1, message).max(max, `Keep this under ${max} characters`);

const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters`).nullable().default(null);

const yearStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Use a four-digit year")
  .refine((value) => {
    const year = Number(value);
    return year >= MIN_YEAR && year <= MAX_FUTURE_YEAR;
  }, `Use a year between ${MIN_YEAR} and ${MAX_FUTURE_YEAR}`);

const optionalYearSchema = yearStringSchema.nullable().default(null);

const optionalUrlSchema = z
  .string()
  .trim()
  .url("Use a valid URL including https://")
  .max(500, "Keep URLs under 500 characters")
  .nullable()
  .default(null);

const optionalUrlStringSchema = z
  .string()
  .trim()
  .max(500, "Keep URLs under 500 characters")
  .refine((value) => value === "" || z.string().url().safeParse(value).success, "Use a valid URL including https://")
  .default("");

export const basicsSchema = z.object({
  targetRole: boundedText(120, "Tell me the role you're aiming for"),
  location: boundedText(120, "Where are you based?"),
  yearsOfExperience: z.number().int().min(0).max(80),
  bio: boundedText(1_000, "Share a short bio"),
});

export const skillSchema = z.object({
  name: boundedText(100),
  category: skillCategorySchema,
  confidenceRating: z.number().int().min(1).max(5),
  source: z.enum(["self_reported", "resume"]).optional(),
});

export const workHistorySchema = z.object({
  companyName: boundedText(120, "Company is required"),
  roleTitle: boundedText(120, "Role is required"),
  outcomes: boundedText(1_500, "Share what you did or accomplished"),
  startDate: yearStringSchema,
  endDate: optionalYearSchema,
  isCurrent: z.boolean().default(false),
});

export const educationSchema = z.object({
  type: educationTypeSchema,
  credentialName: boundedText(160),
  issuer: boundedText(160),
  completionDate: optionalYearSchema,
});

export const languageSchema = z.object({
  name: boundedText(80),
  proficiency: languageProficiencySchema,
});

export const socialLinkSchema = z.object({
  platform: boundedText(40),
  url: z.string().trim().url("Use a valid URL including https://").max(500, "Keep URLs under 500 characters"),
});

export const projectSchema = z.object({
  title: boundedText(160),
  description: optionalText(1_000),
  url: optionalUrlSchema,
  outcomes: z.string().trim().max(1_500, "Keep this under 1500 characters").default(""),
  startDate: optionalYearSchema,
  endDate: optionalYearSchema,
});

export const achievementSchema = z.object({
  type: achievementTypeSchema,
  title: boundedText(160),
  issuer: optionalText(160),
  description: optionalText(1_000),
  url: optionalUrlSchema,
  dateAchieved: optionalYearSchema,
});

export const valuesSchema = z.object({
  workEnvironment: workEnvironmentSchema,
  riskAppetite: riskAppetiteSchema,
  salaryExpectation: boundedText(160, "Share a target compensation"),
  workingStyle: boundedText(1_000, "Describe your working style"),
  constraints: z.string().trim().max(1_000, "Keep this under 1000 characters").default("None"),
});

export const aspirationsSchema = z.object({
  targetRoles: boundedText(500),
  targetIndustries: boundedText(500),
  horizon3y: boundedText(1_000),
  horizon5y: boundedText(1_000),
  definitionOfSuccess: boundedText(1_000),
});

export const importsSchema = z.object({
  linkedinProfileUrl: optionalUrlStringSchema,
  resumeFileName: z.string().default(""),
  resumeRawText: z.string().default(""),
});


const dateRangeSchema = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((value, ctx) => {
    const datedValue = value as { startDate?: string | null; endDate?: string | null };
    const startDate = datedValue.startDate;
    const endDate = datedValue.endDate;
    if (startDate && endDate && Number(endDate) < Number(startDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End year cannot be before start year",
      });
    }
  });

export const onboardingReviewStatusSchema = z.enum(["ready", "needs_user_review"]);
export const onboardingReviewSeveritySchema = z.enum(["critical", "warning", "suggestion"]);
export const onboardingReviewCategorySchema = z.enum([
  "validation",
  "safety",
  "consistency",
  "completeness",
  "quality",
]);

export const onboardingReviewProposedPathSchema = z
  .string()
  .regex(/^(basics\.(targetRole|location|bio)|values\.(salaryExpectation|workingStyle|constraints)|aspirations\.(targetRoles|targetIndustries|horizon3y|horizon5y|definitionOfSuccess)|skills\.\d+\.name|workHistory\.\d+\.(companyName|roleTitle|outcomes|startDate|endDate)|education\.\d+\.(credentialName|issuer|completionDate)|projects\.\d+\.(title|description|url|outcomes|startDate|endDate)|achievements\.\d+\.(title|issuer|description|url|dateAchieved)|languages\.\d+\.name|socialLinks\.\d+\.url|imports\.linkedinProfileUrl)$/);

export const onboardingReviewIssueSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    severity: onboardingReviewSeveritySchema,
    category: onboardingReviewCategorySchema,
    path: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(500),
    proposedValue: z.unknown().optional(),
  })
  .superRefine((issue, ctx) => {
    if (issue.proposedValue !== undefined) {
      const path = onboardingReviewProposedPathSchema.safeParse(issue.path);
      if (!path.success) {
        ctx.addIssue({
          code: "custom",
          path: ["path"],
          message: "proposedValue is only allowed for approved onboarding field paths",
        });
      }
    }
  });

export const onboardingReviewResponseSchema = z.object({
  status: onboardingReviewStatusSchema,
  criticalIssues: z.array(onboardingReviewIssueSchema).default([]),
  warnings: z.array(onboardingReviewIssueSchema).default([]),
  suggestions: z.array(onboardingReviewIssueSchema).default([]),
});

export const onboardingPayloadSchema = z.object({
  basics: basicsSchema,
  skills: z.array(skillSchema).min(1, "Add at least one skill"),
  workHistory: z.array(dateRangeSchema(workHistorySchema)).min(1, "Add at least one role"),
  education: z.array(educationSchema).default([]),
  languages: z.array(languageSchema).default([]),
  socialLinks: z.array(socialLinkSchema).default([]),
  projects: z.array(dateRangeSchema(projectSchema)).default([]),
  achievements: z.array(achievementSchema).default([]),
  values: valuesSchema,
  aspirations: aspirationsSchema,
  imports: importsSchema.default({
    linkedinProfileUrl: "",
    resumeFileName: "",
    resumeRawText: "",
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
export type OnboardingReviewIssue = z.infer<typeof onboardingReviewIssueSchema>;
export type OnboardingReviewResponse = z.infer<typeof onboardingReviewResponseSchema>;
