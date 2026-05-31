import { z } from "zod";
import { onboardingPayloadSchema } from "@kursa/types";

export * from "@kursa/types";

export const completeOnboardingSchema = onboardingPayloadSchema;
export type CompleteOnboardingInput = import("@kursa/types").OnboardingPayload;

// Loose schema for AI onboarding review.
// Coerces possible non-standard responses from LLMs (e.g. status: "blocked" which maps to "needs_user_review")
export const looseReviewIssueSchema = z.object({
  id: z.string().trim().min(1).max(120),
  severity: z.enum(["critical", "warning", "suggestion"]),
  category: z.enum(["validation", "safety", "consistency", "completeness", "quality"]),
  path: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(500),
  proposedValue: z.unknown().optional(),
});

export const looseReviewResponseSchema = z.object({
  status: z.enum(["ready", "needs_user_review", "blocked"]).catch("needs_user_review"),
  criticalIssues: z.array(looseReviewIssueSchema).default([]),
  warnings: z.array(looseReviewIssueSchema).default([]),
  suggestions: z.array(looseReviewIssueSchema).default([]),
});

export type LooseReviewIssue = z.infer<typeof looseReviewIssueSchema>;
export type LooseReviewResponse = z.infer<typeof looseReviewResponseSchema>;
