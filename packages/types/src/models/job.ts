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
