import type { EventEnrichment, MilestoneEvidence } from "./intelligence";

export type CareerEventType =
  | "checkin_weekly"
  | "checkin_monthly"
  | "win"
  | "note"
  | "feedback"
  | "decision"
  | "learning"
  | "aria_observation"
  | "profile_import"
  | "onboarding_complete"
  | "application_update"
  | "github_sync"
  | "system";

export type CareerEventSource = "user" | "aria" | "system";

export interface WeeklyPulseStructured {
  energyFocus: string;
  challengeLevel: number;
  rememberThis?: string;
}

export interface MonthlyReviewStructured {
  satisfaction: number;
  growth: number;
  management: number;
  valuesAlignment: number;
  blockers: string;
  winsSinceLast: string;
}

export interface WinStructured {
  title: string;
  body: string;
  skillNames?: string[];
  impactMetric?: string;
  collaborators?: string[];
  linkedMilestoneOrder?: number;
}

export interface NoteStructured {
  body: string;
  mood?: number;
  tags?: Array<"blocker" | "idea" | "reflection">;
}

export interface FeedbackStructured {
  body: string;
  fromRole: "manager" | "peer" | "self";
  receivedAt?: string;
  linkedSkillNames?: string[];
}

export interface DecisionStructured {
  title: string;
  optionsConsidered: string[];
  choiceMade: string;
  reasoning: string;
  conversationId?: string;
}

export interface LearningStructured {
  skillName: string;
  resourceType?: "course" | "project" | "certification" | "experience";
  hours?: number;
  completed?: boolean;
}

export interface ApplicationUpdateStructured {
  applicationId: string;
  company: string;
  roleTitle: string;
  previousStage?: string;
  newStage: string;
}

export interface CareerEventSummary {
  id: string;
  type: CareerEventType;
  source: CareerEventSource;
  body: string | null;
  structured: unknown;
  sentiment: number | null;
  linkedSkillIds: string[];
  linkedPathId: string | null;
  linkedWorkHistoryId: string | null;
  enrichment: EventEnrichment | null;
  occurredAt: string;
}

export interface JournalTimelineEntry extends CareerEventSummary {
  tag: string;
  agent: boolean;
}

export interface JournalContext {
  statusLabel: string;
  company: string | null;
  roleTitle: string | null;
  tenureDays: number | null;
}

export interface SentimentTrendPoint {
  weekLabel: string;
  value: number;
  summary?: string;
}

export interface CreateWinInput {
  title: string;
  body: string;
  skillNames?: string[];
  impactMetric?: string;
  collaborators?: string[];
  linkedMilestoneOrder?: number;
}

export interface CreateNoteInput {
  body: string;
  mood?: number;
  tags?: Array<"blocker" | "idea" | "reflection">;
}

export interface CreateFeedbackInput {
  body: string;
  fromRole: "manager" | "peer" | "self";
  receivedAt?: string;
  linkedSkillNames?: string[];
}

export interface CreateDecisionInput {
  title: string;
  optionsConsidered: string[];
  choiceMade: string;
  reasoning: string;
}

export interface CreateLearningInput {
  skillName: string;
  resourceType?: "course" | "project" | "certification" | "experience";
  hours?: number;
  completed?: boolean;
}

export interface SubmitCheckInInput {
  type: "checkin_weekly" | "checkin_monthly";
  responses: WeeklyPulseStructured | MonthlyReviewStructured;
}

export interface CheckInNextResponse {
  due: boolean;
  type: "checkin_weekly" | "checkin_monthly" | null;
  questions: Array<{ id: string; label: string; kind: "text" | "scale" }>;
  lastCompletedAt: string | null;
}

export interface ReviewPrepBullet {
  text: string;
  sourceEventId?: string;
}

export interface ReviewPrepSection {
  theme: string;
  bullets: ReviewPrepBullet[];
}

export interface ReviewPrepResponse {
  from: string;
  to: string;
  sections: ReviewPrepSection[];
}

export interface RelevanceSummary {
  pathAlignmentScore: number | null;
  staleSkills: string[];
  winsThisQuarter: number;
  engagementTrend: SentimentTrendPoint[];
  engagementTrendLabel: string;
  intentionActionGap: boolean;
  recentMemoryFacts: string[];
  materialChangeDetected: boolean;
  activePathTitle: string | null;
  memories: Array<{ id: string; category: string; fact: string; confidence: number; validFrom?: string }>;
  milestoneEvidence: MilestoneEvidence[];
  checkInStreak: number;
  journalActivityScore: number;
}
