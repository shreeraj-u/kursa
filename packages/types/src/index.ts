// Shared API contract types for the Kursa monorepo.
// These are the authoritative shapes for data crossing the server/web boundary.
// All JSON fields (aspirations, values) use camelCase — the server's Zod validators
// normalise snake_case input before persisting.

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
  id: string;
  profileId: string;
  company: string;
  roleTitle: string;
  stage: string;
  status: string;
  appliedAt?: string;
  nextAction?: string;
  nextActionAt?: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Camelcase is authoritative — server Zod validators normalise any snake_case on write.
export interface ProfileAspirations {
  targetRoles?: string[];
  targetIndustries?: string[];
  horizon?: string;
  successDefinition?: string;
  threeYear?: string;
  fiveYear?: string;
}

export interface ProfileValues {
  workEnvironment?: "startup" | "corporate" | "remote" | "hybrid";
  riskAppetite?: "stability_seeking" | "balanced" | "high_growth";
  teamSizePreference?: "small" | "medium" | "large" | "any";
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  geographicConstraints?: string[];
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface NotificationPrefs {
  checkInReminders: boolean;
  weeklyDigest: boolean;
  marketAlerts: boolean;
  applicationUpdates: boolean;
}

export interface ProfileUpdateInput {
  location?: string | null;
  bio?: string | null;
  targetRole?: string | null;
  yearsOfExperience?: number | null;
  aspirations?: ProfileAspirations | null;
  values?: ProfileValues | null;
  onboardingDone?: boolean;
}

export interface SocialLinkCreateInput {
  platform: "github" | "linkedin" | "twitter" | "website" | "portfolio";
  url: string;
}

export interface SocialLinkUpdateInput {
  url: string;
}

export type SkillMock = {
  n: string;
  w: number;
  total?: number;
  since: string;
  faded?: boolean;
  label?: string;
};
