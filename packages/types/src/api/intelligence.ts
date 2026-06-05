import type { MilestoneStatus } from "./journey";

export type MemoryCategory =
  | "skill_evidence"
  | "sentiment_pattern"
  | "aspiration_gap"
  | "achievement_theme"
  | "relationship"
  | "market_signal"
  | "sentiment"
  | "skill"
  | "pattern"
  | "contradiction";

export type EnrichmentMethod = "llm" | "rules";

export interface EventEnrichment {
  method: EnrichmentMethod;
  themes: string[];
  entities: string[];
  linkedMilestoneOrders: number[];
  extractedSkillNames: string[];
  sentiment?: number;
  memoryCandidates?: Array<{ category: MemoryCategory; fact: string; confidence: number }>;
}

export interface MilestoneEvidence {
  order: number;
  title: string;
  status: MilestoneStatus;
  eventCount: number;
  recentEventIds: string[];
}

export interface ProactiveNudge {
  id: string;
  type:
    | "path_regen"
    | "sentiment_alert"
    | "milestone_gap"
    | "checkin_reminder"
    | "review_prep";
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  priority: "low" | "medium" | "high";
}

export type ChatDecisionType =
  | "offer_evaluation"
  | "promotion_timing"
  | "education"
  | "negotiation"
  | "general"
  | "journey_setup"
  | "journey_revision";

export interface ChatMessageSummary {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  decisionType: ChatDecisionType | null;
  messages: ChatMessageSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInSyncResult {
  synced: boolean;
  titleChanged: boolean;
  newSkills: string[];
  message: string;
}
