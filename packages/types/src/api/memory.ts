import type { ProfileInput, ProfileSignals } from "./insights";
import type { CareerJourney } from "./journey";
import type { CareerEventSummary } from "./events";
import type { MarketContext } from "./market";

export interface UserMemorySummary {
  id: string;
  category: string;
  fact: string;
  confidence: number;
  validFrom: string;
  /** Present when fact was sourced from Aria chat learning. */
  learnedFromChat?: boolean;
}

export interface SkillLastUsedUpdate {
  name: string;
  date?: Date;
}

export interface NewAchievementDelta {
  title: string;
  description?: string;
  dateAchieved?: Date;
  skillNames?: string[];
}

export interface NewLearningGoalDelta {
  skillName: string;
}

export interface ProfileUpdateDelta {
  skillLastUsed?: SkillLastUsedUpdate[];
  newAchievements?: NewAchievementDelta[];
  newLearningGoals?: NewLearningGoalDelta[];
}

export interface GapSignals {
  activePathTitle: string | null;
  totalGaps: number;
  coveredCount: number;
  inProgressCount: number;
  completedCount: number;
  missingCount: number;
  highPriorityMissing: string[];
  highPriorityCompletedCount: number;
}

export interface AdvisorSignals extends ProfileSignals {
  sentimentTrend12w: number | null;
  checkInStreak: number;
  winsThisQuarter: number;
  repeatedThemes: string[];
  pathMilestonesWithEvidence: number;
  pathMilestonesTotal: number;
  intentionActionGap: boolean;
  recentMemoryFacts: string[];
  gapSignals: GapSignals;
}

export type AdvisorPurpose = "observations" | "paths" | "journal" | "chat";

export interface AdvisorContext {
  purpose: AdvisorPurpose;
  profile: ProfileInput;
  signals: AdvisorSignals;
  recentEvents: CareerEventSummary[];
  memories: UserMemorySummary[];
  activePath: CareerJourney | null;
  materialChangeDetected: boolean;
  marketContext: MarketContext | null;
}

export interface MemoryCandidate {
  category: string;
  fact: string;
  confidence: number;
  sourceEntryIds: string[];
}
