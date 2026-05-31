import { z } from "zod";

export const createWinSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  skillNames: z.array(z.string()).optional(),
  impactMetric: z.string().optional(),
  collaborators: z.array(z.string()).optional(),
  linkedMilestoneOrder: z.number().int().optional(),
});

export const createNoteSchema = z.object({
  body: z.string().trim().min(1),
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.enum(["blocker", "idea", "reflection"])).optional(),
});

export const createFeedbackSchema = z.object({
  body: z.string().trim().min(1),
  fromRole: z.enum(["manager", "peer", "self"]).default("peer"),
  receivedAt: z.string().optional(),
  linkedSkillNames: z.array(z.string()).optional(),
});

export const createDecisionSchema = z.object({
  title: z.string().trim().min(1),
  optionsConsidered: z.array(z.string()).min(1),
  choiceMade: z.string().trim().min(1),
  reasoning: z.string().trim().min(1),
});

export const createLearningSchema = z.object({
  skillName: z.string().trim().min(1),
  resourceType: z.enum(["course", "project", "certification", "experience"]).optional(),
  hours: z.number().optional(),
  completed: z.boolean().optional(),
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
