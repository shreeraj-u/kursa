// Resume Engine (Phase 6, Slice A) — shapes crossing the server/web boundary.
// A Resume is a versioned output of the system's knowledge of the user, shaped
// toward their active CareerPath / target role. Generation appends new versions;
// manual edits mutate the selected version content in place and do not update the Profile.

export interface ResumeExperience {
  company: string;
  roleTitle: string;
  period: string; // e.g. "2024 – present"
  bullets: string[]; // strong context→action→outcome impact statements
}

export interface ResumeEducation {
  credential: string;
  issuer: string;
  year?: string;
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  year?: string;
}

export interface ResumeProject {
  title: string;
  description: string;
}

export type ResumeSectionKey =
  | "summary"
  | "experience"
  | "skills"
  | "education"
  | "certifications"
  | "projects";

export interface ResumeContent {
  fullName: string;
  contact: { email?: string; location?: string; links: string[] };
  summary: string;
  experience: ResumeExperience[];
  skills: string[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  projects?: ResumeProject[];
  sectionOrder?: ResumeSectionKey[];
}

export type AtsSeverity = "high" | "medium" | "low";

export interface AtsIssue {
  severity: AtsSeverity;
  message: string;
  fix: string;
}

export interface Resume {
  id: string;
  version: number;
  careerPathId: string | null;
  targetRole: string | null;
  content: ResumeContent;
  atsScore: number; // 0–100
  atsIssues: AtsIssue[];
  createdAt: string;
}

export interface ResumeQuota {
  used: number;
  limit: number;
}

export interface ResumeListResponse {
  resumes: Resume[];
  quota: ResumeQuota;
}

export interface ResumeProfileSnapshot {
  fullName: string;
  email: string | null;
  location: string | null;
  bio: string | null;
  links: string[];
  skills: Array<{ name: string; confidenceRating: number | null }>;
  workHistories: Array<{
    companyName: string;
    roleTitle: string;
    period: string;
    outcomes: unknown;
  }>;
  educations: Array<{ credentialName: string; issuer: string; year: string | null }>;
  certifications: Array<{ credentialName: string; issuer: string; year: string | null }>;
  projects: Array<{ title: string; description: string }>;
  languages: Array<{ name: string; proficiency: string }>;
}

export interface ResumeTargetContext {
  targetRole: string | null;
  pathTitle: string | null;
  requiredSkills: string[];
}
