import { z } from "zod";

export const createConversationSchema = z.object({
  decisionType: z
    .enum([
      "offer_evaluation",
      "promotion_timing",
      "education",
      "negotiation",
      "general",
      "journey_setup",
      "journey_revision",
    ])
    .optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export const recordDecisionSchema = z.object({
  title: z.string().trim().min(1),
  optionsConsidered: z.array(z.string()),
  choiceMade: z.string().trim().min(1),
  reasoning: z.string().trim().min(1),
});
