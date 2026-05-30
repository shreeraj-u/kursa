import { z } from "zod";

export const createWinSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  skillNames: z.array(z.string()).optional(),
});

export const createNoteSchema = z.object({
  body: z.string().trim().min(1),
});

export const reviewPrepQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const timelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(30),
  filter: z.enum(["all", "win"]).default("all"),
});
