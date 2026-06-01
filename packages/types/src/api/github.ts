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
}

export interface GitHubSyncConfirmRequest {
  selectedRepoIds: number[];
  mergeRepoIds: { repoId: number; projectId: string }[];
}
