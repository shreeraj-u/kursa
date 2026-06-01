import type { ProfileInput, ProfileSignals } from "./insights";
import type { CareerPath } from "./paths";
import type { CareerEventSummary } from "./events";

export interface UserMemorySummary {
  id: string;
  category: string;
  fact: string;
  confidence: number;
  validFrom: string;
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
  activePath: CareerPath | null;
  materialChangeDetected: boolean;
}

export interface MemoryCandidate {
  category: string;
  fact: string;
  confidence: number;
  sourceEntryIds: string[];
}
