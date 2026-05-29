export interface ProfileSignals {
  targetRole: string | null;
  careerTrajectory: string | null;
  profileCompleteness: number;
  dormantHighValueSkills: string[];
  overdueGoals: string[];
  goalsCompletionRatio: { completed: number; total: number };
  daysSinceLastApplication: number | null;
  hasAppliedToTargetRole: boolean;
  currentRoleTenureMonths: number | null;
  hasWorkOutcomes: boolean;
  aspirationsSet: boolean;
  skillsNeverDated: string[];
  noRecentSkillActivity: boolean;
}

export interface ProfileInput {
  bio: string | null;
  targetRole: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  aspirations: unknown | null;
  careerTrajectory: string | null;
  skills: Array<{
    name: string;
    confidenceRating: number | null;
    lastUsedDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  workHistories: Array<{
    isCurrent: boolean;
    startDate: Date;
    outcomes: unknown | null;
  }>;
  learningGoals: Array<{
    skillName: string;
    deadline: Date | null;
    status: string;
  }>;
  jobApplications: Array<{
    appliedAt: Date | null;
  }>;
  socialLinks: Array<unknown>;
}