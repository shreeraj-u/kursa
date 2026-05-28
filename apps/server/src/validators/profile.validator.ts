import { z } from "zod";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const aspirationsCamelCaseSchema = z.object({
  targetRoles: z.array(z.string()).optional(),
  horizon: z.string().optional(),
  successDefinition: z.string().optional(),
});

const aspirationsSnakeCaseSchema = z.object({
  target_roles: z.array(z.string()).optional(),
  horizon: z.string().optional(),
  success_definition: z.string().optional(),
});

const aspirationsSchema = z
  .union([aspirationsCamelCaseSchema, aspirationsSnakeCaseSchema])
  .transform((aspirations) => {
    if ("target_roles" in aspirations || "success_definition" in aspirations) {
      return {
        targetRoles: aspirations.target_roles,
        horizon: aspirations.horizon,
        successDefinition: aspirations.success_definition,
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
  minSalary: z.number().optional(),
  currency: z.string().optional(),
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
      minSalary: raw.minSalary ?? raw.salary_min,
      currency: raw.currency,
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

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
