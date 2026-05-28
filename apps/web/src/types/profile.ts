// Full UserProfile type definitions aligned with the Prisma schema

export interface UserSkill {
  id: string;
  profileId: string;
  name: string;
  category: string;
  proficiencyLevel: string | null;
  confidenceRating: number | null;
  lastUsedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWorkHistory {
  id: string;
  profileId: string;
  companyName: string;
  roleTitle: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  outcomes: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserEducation {
  id: string;
  profileId: string;
  type: string;
  credentialName: string;
  issuer: string;
  completionDate: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: string;
  profileId: string;
  type: string;
  title: string;
  issuer: string | null;
  description: string | null;
  url: string | null;
  dateAchieved: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProject {
  id: string;
  profileId: string;
  workHistoryId: string | null;
  title: string;
  description: string | null;
  url: string | null;
  startDate: Date | null;
  endDate: Date | null;
  outcomes: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLanguage {
  id: string;
  profileId: string;
  name: string;
  proficiency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWorkAuthorization {
  id: string;
  profileId: string;
  country: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserConstraint {
  id: string;
  profileId: string;
  type: string;
  value: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLearningGoal {
  id: string;
  profileId: string;
  skillName: string;
  targetProficiency: string | null;
  deadline: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSocialLink {
  id: string;
  profileId: string;
  platform: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string
  profileId: string
  company: string
  roleTitle: string
  stage: string
  status: string
  appliedAt?: string
  nextAction?: string
  nextActionAt?: string
  url?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProfileAspirations {
  target_roles?: string[];
  target_industries?: string[];
  three_year?: string;
  five_year?: string;
  success_definition?: string;
}

export interface ProfileValues {
  work_environment?: "startup" | "corporate" | "remote" | "hybrid";
  risk_appetite?: "stability_seeking" | "balanced" | "high_growth";
  team_size_preference?: "small" | "medium" | "large" | "any";
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  location: string | null;
  bio: string | null;
  targetRole: string | null;
  yearsOfExperience: number | null;
  aspirations: ProfileAspirations | null;
  values: ProfileValues | null;
  onboardingDone: boolean;
  createdAt: Date;
  updatedAt: Date;

  skills: UserSkill[];
  workHistories: UserWorkHistory[];
  educations: UserEducation[];
  achievements: UserAchievement[];
  projects: UserProject[];
  languages: UserLanguage[];
  workAuthorizations: UserWorkAuthorization[];
  constraints: UserConstraint[];
  learningGoals: UserLearningGoal[];
  socialLinks: UserSocialLink[];
  jobApplications: JobApplication[];
}

export interface Observation {
  text: string;
  timeAgo: string;
  type: "opportunity" | "warning" | "info";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActivityEvent {
  label: string;
  timeAgo: string;
  category: "skill" | "goal" | "work" | "application" | "profile";
  ts: number;
}

export interface FormattedApplication {
  id: string;
  company: string;
  roleTitle: string;
  stage: string;
  stageLabel: string;
  stageIdx: number;
  formattedDate: string;
}

export interface DashboardMetrics {
  pulse: {
    growth: { pattern: number[]; trend: string; observation: string };
    visibility: { pattern: number[]; trend: string; observation: string };
    progression: { pattern: number[]; trend: string; observation: string };
  };
  recentActivity: ActivityEvent[];
  inFlight: {
    activeCount: number;
    closedCount: number;
    applications: FormattedApplication[];
  };
  greeting: {
    dayN: number;
    attentionCount: number;
  };
}
