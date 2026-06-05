import { z } from "zod";

const skillCategory = z.enum(["technical", "soft", "tool"]);
const skillProficiency = z.enum(["beginner", "intermediate", "advanced", "expert"]);
const skillSource = z.enum([
  "self_reported",
  "resume",
  "inferred_checkin",
  "inferred_journal",
  "inferred_chat",
  "market",
  "path",
  "user_edited",
]);

export const skillCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: skillCategory,
  confidenceRating: z.number().int().min(1).max(5).optional(),
  proficiencyLevel: skillProficiency.optional(),
  source: skillSource.optional(),
});

export const skillUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  category: skillCategory.optional(),
  confidenceRating: z.number().int().min(1).max(5).optional(),
  proficiencyLevel: skillProficiency.nullable().optional(),
  lastUsedDate: z.string().datetime().nullable().optional(),
});

export const skillProposalQuerySchema = z.object({
  status: z.enum(["pending", "accepted", "dismissed"]).default("pending"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
