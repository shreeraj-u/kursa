import type { JobApplicationStage, JobApplicationStatus } from "@kursa/types";

export const STAGE_ORDER: JobApplicationStage[] = [
  "shortlisted",
  "applied",
  "phone_screen",
  "technical",
  "on_site",
  "offer",
  "closed",
];

export const STAGE_LABEL: Record<JobApplicationStage, string> = {
  shortlisted: "Shortlisted",
  applied: "Applied",
  phone_screen: "Phone Screen",
  technical: "Technical",
  on_site: "On-site",
  offer: "Offer",
  closed: "Closed",
};

export const STAGE_IDX: Record<JobApplicationStage, number> = {
  shortlisted: 0,
  applied: 1,
  phone_screen: 2,
  technical: 3,
  on_site: 4,
  offer: 5,
  closed: 6,
};

export const STATUS_LABEL: Record<JobApplicationStatus, string> = {
  active: "Active",
  passed: "Passed",
  closed: "Closed",
};
