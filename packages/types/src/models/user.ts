import type { JobApplication } from './job';
import type { JourneyPreferences } from '../api/journey';

export interface UserSkill {
  id: string;
  profileId: string;
  name: string;
  category: string;
  proficiencyLevel: string | null;
  confidenceRating: number | null;
  lastUsedDate: Date | null;
  source: string | null;
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
  deadline: string | null;
  status: string;
  position: number;
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
  journeyPreferences?: JourneyPreferences;
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
  dashboardGuideCompletedAt: Date | null;
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
