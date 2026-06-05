import { z } from "zod";
import {
  journeyPreferencesSchema,
  skillCategorySchema,
  skillProficiencySchema,
  learningGoalStatusSchema,
} from "@kursa/types";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const aspirationsCamelCaseSchema = z.object({
  targetRoles: z.array(z.string()).optional(),
  targetIndustries: z.array(z.string()).optional(),
  horizon: z.string().optional(),
  successDefinition: z.string().optional(),
  threeYear: z.string().optional(),
  fiveYear: z.string().optional(),
});

const aspirationsSnakeCaseSchema = z.object({
  target_roles: z.array(z.string()).optional(),
  target_industries: z.array(z.string()).optional(),
  horizon: z.string().optional(),
  success_definition: z.string().optional(),
  three_year: z.string().optional(),
  five_year: z.string().optional(),
});

const aspirationsSchema = z
  .union([aspirationsCamelCaseSchema, aspirationsSnakeCaseSchema])
  .transform((aspirations) => {
    const isSnake =
      "target_roles" in aspirations ||
      "target_industries" in aspirations ||
      "success_definition" in aspirations ||
      "three_year" in aspirations ||
      "five_year" in aspirations;

    if (isSnake) {
      return {
        targetRoles: aspirations.target_roles,
        targetIndustries: aspirations.target_industries,
        horizon: aspirations.horizon,
        successDefinition: aspirations.success_definition,
        threeYear: aspirations.three_year,
        fiveYear: aspirations.five_year,
      };
    }
    return aspirations;
  })
  .optional()
  .nullable();

const valuesSchemaShape = z.object({
  workEnvironment: z
    .enum(["startup", "corporate", "remote", "hybrid"])
    .optional(),
  riskAppetite: z
    .enum(["stability_seeking", "balanced", "high_growth"])
    .optional(),
  teamSizePreference: z
    .enum(["small", "medium", "large", "any"])
    .optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  currency: z.string().optional(),
  geographicConstraints: z.array(z.string()).optional(),
  journeyPreferences: journeyPreferencesSchema.optional(),
});

const valuesSchema = z.preprocess(
  (input) => {
    if (input == null || typeof input !== "object" || Array.isArray(input)) {
      return input;
    }
    const raw = input as Record<string, unknown>;
    return {
      workEnvironment: raw.workEnvironment ?? raw.work_environment,
      riskAppetite: raw.riskAppetite ?? raw.risk_appetite,
      teamSizePreference: raw.teamSizePreference ?? raw.team_size_preference,
      minSalary: raw.minSalary ?? raw.salary_min,
      maxSalary: raw.maxSalary ?? raw.salary_max,
      currency: raw.currency ?? raw.salary_currency,
      geographicConstraints: raw.geographicConstraints ?? raw.geographic_constraints,
      journeyPreferences: raw.journeyPreferences ?? raw.journey_preferences,
    };
  },
  valuesSchemaShape.optional().nullable()
);

// ── Exported schemas ──────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  location: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  targetRole: z.string().max(200).optional().nullable(),
  yearsOfExperience: z.number().int().min(0).max(60).optional().nullable(),
  aspirations: aspirationsSchema,
  values: valuesSchema,
  onboardingDone: z.boolean().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

// Type inference moved to @kursa/types

// ── Social link schemas ───────────────────────────────────────────────────────

export const socialLinkCreateSchema = z.object({
  platform: z.enum(["github", "linkedin", "twitter", "website", "portfolio"]),
  url: z.string().url().max(500),
});

export const socialLinkUpdateSchema = z.object({
  url: z.string().url().max(500),
});

// ── Skill inventory schemas ───────────────────────────────────────────────────

export const skillCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: skillCategorySchema,
  confidenceRating: z.number().int().min(1).max(5),
  proficiencyLevel: skillProficiencySchema.nullish(),
});

export const skillUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    category: skillCategorySchema,
    confidenceRating: z.number().int().min(1).max(5),
    proficiencyLevel: skillProficiencySchema.nullable(),
  })
  .partial();

// ── Learning goal schemas ─────────────────────────────────────────────────────

export const learningGoalCreateSchema = z.object({
  skillName: z.string().trim().min(1).max(100),
  targetProficiency: skillProficiencySchema.nullish(),
  deadline: z.string().nullish(),
  status: learningGoalStatusSchema.optional(),
  position: z.number().int().min(0).optional(),
  gapPriority: z.string().optional(),
  pathTitle: z.string().optional(),
  whyItMatters: z.string().optional(),
});

export const learningGoalUpdateSchema = z
  .object({
    skillName: z.string().trim().min(1).max(100),
    targetProficiency: skillProficiencySchema.nullable(),
    deadline: z.string().nullable(),
    status: learningGoalStatusSchema,
    position: z.number().int().min(0),
  })
  .partial();

// Type inference moved to @kursa/types
