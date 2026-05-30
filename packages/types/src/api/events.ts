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
}

export interface NoteStructured {
  body: string;
}

export interface FeedbackStructured {
  body: string;
  fromRole: "manager" | "peer" | "self";
}

export interface CareerEventSummary {
  id: string;
  type: CareerEventType;
  source: CareerEventSource;
  body: string | null;
  structured: unknown;
  sentiment: number | null;
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
}

export interface CreateNoteInput {
  body: string;
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

export interface ReviewPrepSection {
  theme: string;
  bullets: string[];
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
}
