export type JobApplicationStage =
  | "shortlisted"
  | "applied"
  | "phone_screen"
  | "technical"
  | "on_site"
  | "offer"
  | "closed";

export type JobApplicationStatus = "active" | "passed" | "closed";

export interface ApplicationCreateInput {
  company: string;
  roleTitle: string;
  stage?: JobApplicationStage;
  status?: JobApplicationStatus;
  url?: string | null;
  notes?: string | null;
  appliedAt?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
}

export interface ApplicationUpdateInput {
  company?: string;
  roleTitle?: string;
  stage?: JobApplicationStage;
  status?: JobApplicationStatus;
  url?: string | null;
  notes?: string | null;
  appliedAt?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
}

export interface ApplicationListResponse {
  applications: import("../models/job").JobApplication[];
}
