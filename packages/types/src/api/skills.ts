// Skill inventory — value lists and request shapes shared across the boundary.
// Strength is two distinct dimensions: confidence (1–5) and proficiency (enum).

import { z } from "zod";

export const skillCategoryValues = ["technical", "soft", "tool"] as const;
export type SkillCategoryValue = (typeof skillCategoryValues)[number];
export const skillCategorySchema = z.enum(skillCategoryValues);

export const skillProficiencyValues = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;
export type SkillProficiencyValue = (typeof skillProficiencyValues)[number];
export const skillProficiencySchema = z.enum(skillProficiencyValues);

export const learningGoalStatusValues = [
  "PLANNED",
  "LEARNING",
  "COMPLETED",
] as const;
export type LearningGoalStatusValue = (typeof learningGoalStatusValues)[number];
export const learningGoalStatusSchema = z.enum(learningGoalStatusValues);

/** @deprecated Use SkillCategoryValue */
export type SkillCategoryType = SkillCategoryValue;
/** @deprecated Use SkillProficiencyValue */
export type SkillProficiencyType = SkillProficiencyValue;

export type SkillSourceType =
  | "self_reported"
  | "resume"
  | "inferred_checkin"
  | "inferred_journal"
  | "inferred_chat"
  | "market"
  | "path"
  | "user_edited"
  | "github_import";

export type SkillProposalType = "add" | "update_confidence" | "mark_learning" | "mark_stale";
export type SkillProposalSource = "chat" | "market" | "path" | "journal" | "github";
export type SkillProposalStatus = "pending" | "accepted" | "dismissed";

export interface SkillSummary {
  id: string;
  name: string;
  category: SkillCategoryValue;
  proficiencyLevel: SkillProficiencyValue | null;
  confidenceRating: number | null;
  lastUsedDate: string | null;
  source: SkillSourceType | null;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRecommendation {
  skillName: string;
  reason: string;
  priority: number;
  source: "market" | "path" | "goal" | "memory" | "advisor" | "github";
  cta: "add_skill" | "start_learning";
}

export interface SkillProposalSummary {
  id: string;
  canonicalName: string;
  displayName: string;
  category: SkillCategoryValue;
  proposalType: SkillProposalType;
  suggestedConfidence: number | null;
  evidence: string;
  source: SkillProposalSource;
  status: SkillProposalStatus;
  createdAt: string;
}

export interface LearningGoalSummary {
  id: string;
  skillName: string;
  /** Short label for UI when skillName is legacy long journal text. */
  displayName: string;
  status: string;
  deadline: string | null;
}

export interface SkillsOverviewResponse {
  skills: SkillSummary[];
  recommendations: SkillRecommendation[];
  proposals: SkillProposalSummary[];
  learningGoals: LearningGoalSummary[];
  signals: {
    profileCompleteness: number;
    staleCount: number;
    marketAlignedCount: number;
    pendingProposalCount: number;
  };
}

export interface SkillCreateInput {
  name: string;
  category: SkillCategoryValue;
  confidenceRating?: number;
  proficiencyLevel?: SkillProficiencyValue | null;
  source?: SkillSourceType;
}

export interface SkillUpdateInput {
  name?: string;
  category?: SkillCategoryValue;
  confidenceRating?: number;
  proficiencyLevel?: SkillProficiencyValue | null;
  lastUsedDate?: string | null;
}

export interface LearningGoalCreateInput {
  skillName: string;
  targetProficiency?: SkillProficiencyValue | null;
  deadline?: string | null;
  status?: LearningGoalStatusValue;
  position?: number;
  gapPriority?: string;
  pathTitle?: string;
  whyItMatters?: string;
}

export interface LearningGoalUpdateInput {
  skillName?: string;
  targetProficiency?: SkillProficiencyValue | null;
  deadline?: string | null;
  status?: LearningGoalStatusValue;
  position?: number;
}

export interface SkillProposalListResponse {
  data: SkillProposalSummary[];
  total: number;
}

export interface ChatSkillProposalHint {
  id: string;
  displayName: string;
  evidence: string;
  proposalType: SkillProposalType;
}
