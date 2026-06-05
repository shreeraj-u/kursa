import { Prisma } from "@kursa/db";
import type {
  AtsIssue,
  Resume,
  ResumeContent,
  ResumeProfileSnapshot,
  ResumeTargetContext,
} from "@kursa/types";

export type ProfileWithRelations = Prisma.ProfileGetPayload<{
  include: {
    skills: { select: { name: true; confidenceRating: true } };
    workHistories: { select: { companyName: true; roleTitle: true; startDate: true; endDate: true; isCurrent: true; outcomes: true } };
    educations: { select: { type: true; credentialName: true; issuer: true; completionDate: true } };
    projects: { select: { title: true; description: true; url: true; startDate: true; endDate: true; outcomes: true } };
    achievements: { select: { type: true; title: true; issuer: true; url: true; dateAchieved: true } };
    languages: { select: { name: true; proficiency: true } };
    socialLinks: { select: { url: true } };
  };
}>;

export function toSnapshot(
  name: string,
  email: string,
  profile: ProfileWithRelations,
): ResumeProfileSnapshot {
  const educations = profile.educations.filter((e) => e.type !== "certification");
  const certifications = profile.educations.filter((e) => e.type === "certification");

  return {
    fullName: name,
    email,
    location: profile.location,
    bio: profile.bio,
    links: profile.socialLinks.map((l) => l.url),
    skills: profile.skills.map((s) => ({
      name: s.name,
      confidenceRating: s.confidenceRating,
    })),
    workHistories: profile.workHistories.map((w) => ({
      companyName: w.companyName,
      roleTitle: w.roleTitle,
      period: formatPeriod(w.startDate, w.endDate, w.isCurrent),
      outcomes: w.outcomes,
    })),
    educations: educations.map((e) => ({
      credentialName: e.credentialName,
      issuer: e.issuer,
      year: e.completionDate ? String(new Date(e.completionDate).getFullYear()) : null,
    })),
    certifications: certifications.map((e) => ({
      credentialName: e.credentialName,
      issuer: e.issuer,
      year: e.completionDate ? String(new Date(e.completionDate).getFullYear()) : null,
    })),
    projects: profile.projects.map((p) => ({
      title: p.title,
      description: p.description ?? "",
      period: formatOptionalPeriod(p.startDate, p.endDate),
      url: p.url,
      outcomes: normalizeOutcomeText(p.outcomes),
    })),
    achievements: profile.achievements.map((a) => ({
      type: a.type,
      title: a.title,
      issuer: a.issuer,
      url: a.url,
      year: a.dateAchieved ? String(new Date(a.dateAchieved).getFullYear()) : null,
    })),
    languages: profile.languages.map((l) => ({
      name: l.name,
      proficiency: String(l.proficiency),
    })),
  };
}

export function toTarget(
  activePath: { id: string; title: string; milestones: unknown } | undefined,
): ResumeTargetContext {
  if (!activePath) return { targetRole: null, pathTitle: null, requiredSkills: [] };

  const milestones = Array.isArray(activePath.milestones)
    ? (activePath.milestones as Array<{ requiredSkills?: string[] }>)
    : [];
  const requiredSkills = [
    ...new Set(milestones.flatMap((m) => m.requiredSkills ?? [])),
  ].slice(0, 15);

  return { targetRole: activePath.title, pathTitle: activePath.title, requiredSkills };
}

function formatPeriod(start: Date, end: Date | null, isCurrent: boolean): string {
  const s = new Date(start).getFullYear();
  const e = isCurrent ? "Present" : end ? new Date(end).getFullYear() : "";
  return e ? `${s} – ${e}` : `${s}`;
}

function formatOptionalPeriod(start: Date | null, end: Date | null): string | null {
  if (!start && !end) return null;
  const s = start ? String(new Date(start).getFullYear()) : "";
  const e = end ? String(new Date(end).getFullYear()) : "Present";
  return s ? `${s} – ${e}` : e;
}

function normalizeOutcomeText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text;
  return JSON.stringify(value);
}

export function toResume(row: {
  id: string;
  version: number;
  careerPathId: string | null;
  targetRole: string | null;
  content: unknown;
  atsScore: number;
  atsIssues: unknown;
  createdAt: Date;
}): Resume {
  return {
    id: row.id,
    version: row.version,
    careerPathId: row.careerPathId,
    targetRole: row.targetRole,
    content: row.content as ResumeContent,
    atsScore: row.atsScore,
    atsIssues: (row.atsIssues as AtsIssue[]) ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}
