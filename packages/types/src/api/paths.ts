// Career Path Intelligence — shapes crossing the server/web boundary.
// A CareerPath is disposable AI output: regeneration replaces the user's set.
// The only user state on a path is `isActive`. Milestone `status` is AI-inferred
// at generation time but can also be set manually by the user (user wins).

export type MilestoneStatus = "not_started" | "in_progress" | "completed";

export type PathDetailPriority = "high" | "medium" | "low";

export interface CareerPathSkillGap {
  skill: string;
  whyItMatters: string;
  priority: PathDetailPriority;
}

export interface CareerPathNextAction {
  title: string;
  description: string;
  timeframe: string;
}

export interface CareerPathRisk {
  risk: string;
  mitigation: string;
}

export interface CareerPathDetails {
  fitReasons: string[];
  skillGaps: CareerPathSkillGap[];
  nextActions: CareerPathNextAction[];
  risks: CareerPathRisk[];
  evidence: string[];
}

export interface Milestone {
  order: number;
  title: string;
  description: string;
  estimatedMonthsFromNow: number;
  // AI-estimated, USD-only for Phase 2. Real benchmarked data lands in Phase 3.
  salaryBand: { min: number; max: number; currency: "USD" };
  requiredSkills: string[];
  status: MilestoneStatus;
  manuallySet?: boolean;
}

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  confidenceScore: number; // 0–1, how achievable given the current profile
  projectedTimelineMonths: number;
  details?: CareerPathDetails | null;
  milestones: Milestone[];
  isActive?: boolean;
}

export interface CareerPathsResponse {
  paths: CareerPath[];
}
