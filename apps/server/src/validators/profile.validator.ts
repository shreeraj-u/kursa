import { z } from "zod";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const aspirationsSchema = z
  .object({
    targetRoles: z.array(z.string()).optional(),
    horizon: z.string().optional(),
    successDefinition: z.string().optional(),
  })
  .optional()
  .nullable();

const valuesSchema = z
  .object({
    workEnvironment: z
      .enum(["startup", "corporate", "remote", "hybrid"])
      .optional(),
    riskAppetite: z
      .enum(["stability_seeking", "balanced", "high_growth"])
      .optional(),
    minSalary: z.number().optional(),
    currency: z.string().optional(),
  })
  .optional()
  .nullable();

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
