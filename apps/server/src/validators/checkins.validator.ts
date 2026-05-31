import { z } from "zod";

const weeklyPulseSchema = z.object({
  energyFocus: z.string().trim().min(1),
  challengeLevel: z.number().int().min(1).max(5),
  rememberThis: z.string().trim().optional(),
});

const monthlyReviewSchema = z.object({
  satisfaction: z.number().int().min(1).max(5),
  growth: z.number().int().min(1).max(5),
  management: z.number().int().min(1).max(5),
  valuesAlignment: z.number().int().min(1).max(5),
  blockers: z.string().trim().min(1),
  winsSinceLast: z.string().trim().min(1),
});

export const submitCheckInSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("checkin_weekly"),
    responses: weeklyPulseSchema,
  }),
  z.object({
    type: z.literal("checkin_monthly"),
    responses: monthlyReviewSchema,
  }),
]);
