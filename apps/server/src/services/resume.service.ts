import prisma, { Prisma } from "@kursa/db";
import type { AtsIssue, Resume, ResumeContent, ResumeImproveAtsResponse } from "@kursa/types";

import { generateResume as aiGenerateResume, improveResumeForAts, scoreAts } from "../lib/ai/resume.generate.js";
import { resumeContentSchema } from "../validators/resume.validator.js";
import * as mapper from "./resume.mapper.js";

// --- constants & guardrails ---
export const RESUME_DAILY_LIMIT = 10;
export const IMPROVE_ATS_DAILY_LIMIT = 1;
// Only the 3 most recent versions are kept and accessible; older ones are pruned
// on generation and never returned to the client.
const MAX_STORED_VERSIONS = 3;

const IN_SKILLS = 40;
const IN_ROLES = 12;
const IN_EDU = 10;
const IN_PROJECTS = 10;
const IN_ACHIEVEMENTS = 15;
const IN_LANGS = 8;

const inFlight = new Set<string>();

// In-memory daily quota for ATS improvements (lightweight guardrail; resets on server restart)
const improveAtsUsage = new Map<string, { date: string; count: number }>();

function improvesUsedToday(profileId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const entry = improveAtsUsage.get(profileId);
  return entry?.date === today ? entry.count : 0;
}

function recordImproveUsed(profileId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = improveAtsUsage.get(profileId);
  if (entry?.date === today) {
    entry.count++;
  } else {
    improveAtsUsage.set(profileId, { date: today, count: 1 });
  }
}

// --- custom errors ---
export class QuotaExceededError extends Error {
  constructor(public readonly used: number, public readonly limit: number) {
    super(`Daily resume limit reached (${used}/${limit})`);
    this.name = "QuotaExceededError";
  }
}

export class GenerationInProgressError extends Error {
  constructor() {
    super("A resume is already being generated");
    this.name = "GenerationInProgressError";
  }
}

export class InvalidResumeContentError extends Error {
  constructor(public readonly details: unknown) {
    super("Invalid resume content");
    this.name = "InvalidResumeContentError";
  }
}

const PROFILE_INCLUDE = {
  skills: { select: { name: true, confidenceRating: true }, take: IN_SKILLS },
  workHistories: {
    select: { companyName: true, roleTitle: true, startDate: true, endDate: true, isCurrent: true, outcomes: true },
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
    take: IN_ROLES,
  },
  educations: {
    select: { type: true, credentialName: true, issuer: true, completionDate: true },
    orderBy: { completionDate: "desc" },
    take: IN_EDU,
  },
  projects: {
    select: { title: true, description: true, url: true, startDate: true, endDate: true, outcomes: true },
    orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
    take: IN_PROJECTS,
  },
  achievements: {
    select: { type: true, title: true, issuer: true, url: true, dateAchieved: true },
    orderBy: { dateAchieved: "desc" },
    take: IN_ACHIEVEMENTS,
  },
  languages: { select: { name: true, proficiency: true }, take: IN_LANGS },
  socialLinks: { select: { url: true } },
  careerPaths: {
    where: { isActive: true },
    select: { id: true, title: true, milestones: true },
    take: 1,
  },
} satisfies Prisma.ProfileInclude;

// --- concurrency guard helper ---
async function acquireLock<T>(userId: string, action: () => Promise<T>): Promise<T> {
  if (inFlight.has(userId)) throw new GenerationInProgressError();
  inFlight.add(userId);
  try {
    return await action();
  } finally {
    inFlight.delete(userId);
  }
}

// --- core public actions ---

export async function listResumes(userId: string): Promise<{ resumes: Resume[]; quota: { used: number; limit: number } } | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const rows = await prisma.resume.findMany({
    where: { profileId: profile.id },
    orderBy: { version: "desc" },
    take: MAX_STORED_VERSIONS,
  });

  return {
    resumes: rows.map(mapper.toResume),
    quota: { used: await usedToday(profile.id), limit: RESUME_DAILY_LIMIT },
  };
}

export async function generateResume(userId: string): Promise<Resume | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, profile: { include: PROFILE_INCLUDE } },
  });
  if (!user?.profile) return null;
  const profile = user.profile;

  const used = await usedToday(profile.id);
  if (used >= RESUME_DAILY_LIMIT) throw new QuotaExceededError(used, RESUME_DAILY_LIMIT);

  if (!profile.careerPaths[0]) return null;

  return acquireLock(userId, async () => {
    const snapshot = mapper.toSnapshot(user.name, user.email, profile);
    const target = mapper.toTarget(profile.careerPaths[0]!);

    const content = await aiGenerateResume(snapshot, target);
    const { atsScore, atsIssues } = await scoreAts(content, target);

    const last = await prisma.resume.findFirst({
      where: { profileId: profile.id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const version = (last?.version ?? 0) + 1;

    const row = await prisma.resume.create({
      data: {
        profileId: profile.id,
        careerPathId: profile.careerPaths[0]?.id ?? null,
        targetRole: target.targetRole,
        version,
        content: content as unknown as Prisma.InputJsonValue,
        atsScore,
        atsIssues: atsIssues as unknown as Prisma.InputJsonValue,
      },
    });

    await pruneOldVersions(profile.id);
    return mapper.toResume(row);
  });
}

export async function updateResume(userId: string, id: string, content: unknown): Promise<Resume | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const row = await prisma.resume.findFirst({
    where: { id, profileId: profile.id },
    select: { id: true },
  });
  if (!row) return null;

  const parsed = resumeContentSchema.safeParse(content);
  if (!parsed.success) throw new InvalidResumeContentError(parsed.error.flatten());

  const updated = await prisma.resume.update({
    where: { id },
    data: { content: parsed.data as unknown as Prisma.InputJsonValue },
  });
  return mapper.toResume(updated);
}

export async function analyzeResume(userId: string, id: string): Promise<Resume | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      careerPaths: {
        where: { isActive: true },
        select: { id: true, title: true, milestones: true },
        take: 1,
      },
    },
  });
  if (!profile) return null;

  const row = await prisma.resume.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!row) return null;
  if (!profile.careerPaths[0]) return null;

  return acquireLock(userId, async () => {
    const content = row.content as unknown as ResumeContent;
    const target = mapper.toTarget(profile.careerPaths[0]!);
    const { atsScore, atsIssues } = await scoreAts(content, target);

    const updated = await prisma.resume.update({
      where: { id },
      data: {
        atsScore,
        atsIssues: atsIssues as unknown as Prisma.InputJsonValue,
      },
    });
    return mapper.toResume(updated);
  });
}


export async function improveResumeAts(userId: string, id: string): Promise<ResumeImproveAtsResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, profile: { include: PROFILE_INCLUDE } },
  });
  if (!user?.profile) return null;
  const profile = user.profile;

  const row = await prisma.resume.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!row) return null;
  if (!profile.careerPaths[0]) return null;

  const used = improvesUsedToday(profile.id);
  if (used >= IMPROVE_ATS_DAILY_LIMIT) throw new QuotaExceededError(used, IMPROVE_ATS_DAILY_LIMIT);

  return acquireLock(userId, async () => {
    const content = row.content as unknown as ResumeContent;
    const atsIssues = (row.atsIssues as unknown as AtsIssue[]) ?? [];
    const snapshot = mapper.toSnapshot(user.name, user.email, profile);
    const target = mapper.toTarget(profile.careerPaths[0]!);
    const draft = await improveResumeForAts(content, atsIssues, target, snapshot);

    recordImproveUsed(profile.id);
    return { draft, changedPaths: diffResumePaths(content, draft) };
  });
}

export async function getResume(userId: string, id: string): Promise<Resume | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const row = await prisma.resume.findFirst({
    where: { id, profileId: profile.id },
  });
  return row ? mapper.toResume(row) : null;
}

// --- helpers ---

async function usedToday(profileId: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.resume.count({
    where: { profileId, createdAt: { gte: start } },
  });
}

async function pruneOldVersions(profileId: string): Promise<void> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const keep = await prisma.resume.findMany({
    where: { profileId },
    orderBy: { version: "desc" },
    take: MAX_STORED_VERSIONS,
    select: { id: true },
  });

  // Only prune versions from previous days so today's rows remain available for
  // quota counting via usedToday(). Older history is still capped once it falls
  // outside the latest MAX_STORED_VERSIONS.
  await prisma.resume.deleteMany({
    where: {
      profileId,
      createdAt: { lt: startOfToday },
      id: { notIn: keep.map((r) => r.id) },
    },
  });
}

function diffResumePaths(before: unknown, after: unknown, prefix = ""): string[] {
  if (Object.is(before, after)) return [];

  if (!isRecord(before) || !isRecord(after)) {
    return [prefix || "resume"];
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const paths: string[] = [];
  for (const key of keys) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    const beforeValue = before[key];
    const afterValue = after[key];

    if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) continue;
    if (isRecord(beforeValue) && isRecord(afterValue)) {
      paths.push(...diffResumePaths(beforeValue, afterValue, nextPrefix));
    } else {
      paths.push(nextPrefix);
    }
  }
  return paths;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
