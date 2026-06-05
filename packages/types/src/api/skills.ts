export type SkillCategoryType = "technical" | "soft" | "tool";
export type SkillProficiencyType = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillSourceType =
  | "self_reported"
  | "resume"
  | "inferred_checkin"
  | "inferred_journal"
  | "inferred_chat"
  | "market"
  | "path"
  | "user_edited";

export type SkillProposalType = "add" | "update_confidence" | "mark_learning" | "mark_stale";
export type SkillProposalSource = "chat" | "market" | "path" | "journal";
export type SkillProposalStatus = "pending" | "accepted" | "dismissed";

export interface SkillSummary {
  id: string;
  name: string;
  category: SkillCategoryType;
  proficiencyLevel: SkillProficiencyType | null;
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
  source: "market" | "path" | "goal" | "memory" | "advisor";
  cta: "add_skill" | "start_learning";
}

export interface SkillProposalSummary {
  id: string;
  canonicalName: string;
  displayName: string;
  category: SkillCategoryType;
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
  category: SkillCategoryType;
  confidenceRating?: number;
  proficiencyLevel?: SkillProficiencyType;
  source?: SkillSourceType;
}

export interface SkillUpdateInput {
  name?: string;
  category?: SkillCategoryType;
  confidenceRating?: number;
  proficiencyLevel?: SkillProficiencyType | null;
  lastUsedDate?: string | null;
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
