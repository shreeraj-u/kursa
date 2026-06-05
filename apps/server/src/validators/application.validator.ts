import { z } from "zod";

const stageSchema = z.enum([
  "shortlisted",
  "applied",
  "phone_screen",
  "technical",
  "on_site",
  "offer",
  "closed",
]);

const statusSchema = z.enum(["active", "passed", "closed"]);

export const applicationCreateSchema = z.object({
  company: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().min(1).max(200),
  stage: stageSchema.default("shortlisted"),
  status: statusSchema.default("active"),
  url: z.string().url().max(500).nullish(),
  notes: z.string().max(2000).nullish(),
  appliedAt: z.string().datetime().nullish(),
  nextAction: z.string().max(500).nullish(),
  nextActionAt: z.string().datetime().nullish(),
});

export const applicationUpdateSchema = z
  .object({
    company: z.string().trim().min(1).max(200),
    roleTitle: z.string().trim().min(1).max(200),
    stage: stageSchema,
    status: statusSchema,
    url: z.string().url().max(500).nullable(),
    notes: z.string().max(2000).nullable(),
    appliedAt: z.string().datetime().nullable(),
    nextAction: z.string().max(500).nullable(),
    nextActionAt: z.string().datetime().nullable(),
  })
  .partial();

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
