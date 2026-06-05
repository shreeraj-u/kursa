export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  created_at: string;
  pushed_at: string;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
}

export type GitHubRepoStatus = "new" | "existing" | "merge_candidate";

export interface GitHubRepoPreview {
  repo: GitHubRepo;
  status: GitHubRepoStatus;
  existingProjectId?: string;
}

export interface GitHubSyncPreviewResponse {
  repos: GitHubRepoPreview[];
  connected: boolean;
  snapshotStatus?: "pending" | "complete" | "failed" | "none";
  lastIngestedAt?: string | null;
}

export interface GitHubSyncConfirmRequest {
  selectedRepoIds: number[];
  mergeRepoIds: { repoId: number; projectId: string }[];
  /** Accept pending project proposals by id (preferred over selectedRepoIds). */
  acceptedProposalIds?: string[];
}

export interface GitHubSyncSummaryResponse {
  imported: number;
  merged: number;
  skills: string[];
  projects: string[];
  githubUrl?: string;
}

export interface GitHubActiveRepo {
  name: string;
  url: string;
  pushedAt: string;
  language: string | null;
  topics: string[];
}

export interface GitHubLanguageMix {
  language: string;
  weight: number;
}

export type GitHubPushVelocity = "accelerating" | "steady" | "slowing" | "inactive";

export interface GitHubWorkPatterns {
  activeRepos: GitHubActiveRepo[];
  dormantRepos: string[];
  languageMix: GitHubLanguageMix[];
  topTopics: string[];
  frameworkSignals: string[];
  pushVelocity: GitHubPushVelocity;
  lastActiveAt: string | null;
  weeklyCommitRhythm?: number[];
}

export interface GitHubLanguageShift {
  language: string;
  direction: "up" | "down";
}

export interface GitHubSyncDelta {
  newRepos: string[];
  newlyActiveRepos: string[];
  languageShifts: GitHubLanguageShift[];
  newTopics: string[];
  significantPushes: Array<{
    repo: string;
    previousPushedAt: string;
    currentPushedAt: string;
  }>;
  pushVelocityChanged?: boolean;
}

export interface GitHubRepoEnriched extends GitHubRepo {
  readmeExcerpt?: string | null;
  languages?: GitHubLanguageMix[];
}

export interface GitHubNormalizedSnapshot {
  profile: {
    login: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    avatarUrl: string | null;
  };
  profileReadme: string | null;
  repos: GitHubRepoEnriched[];
  workPatterns: GitHubWorkPatterns;
}

export interface GitHubStatusResponse {
  connected: boolean;
  username: string | null;
  githubUrl: string | null;
  snapshotStatus: "pending" | "complete" | "failed" | "none";
  lastIngestedAt: string | null;
  pushVelocity: GitHubPushVelocity | null;
  pendingSkillProposals: number;
  pendingProjectProposals: number;
  lastError: string | null;
}

export interface ProjectProposalSummary {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  outcomes: Record<string, unknown> | null;
  startDate: string | null;
  endDate: string | null;
  evidence: string;
  source: string;
  sourceRef?: Record<string, unknown> | null;
  status: "pending" | "accepted" | "dismissed";
  createdAt: string;
}
