import prisma, { Prisma } from "@kursa/db";
import type { CareerPath, Milestone } from "@kursa/types";

import { assembleAdvisorContext } from "../lib/advisor-context.js";
import {
  generateCareerPaths,
  type GeneratedPath,
  type PathProfileSnapshot,
} from "../lib/ai/paths.generate.js";

const PROFILE_SELECT = {
  id: true,
  bio: true,
  targetRole: true,
  location: true,
  yearsOfExperience: true,
  careerTrajectory: true,
  aspirations: true,
  skills: {
    select: { name: true, confidenceRating: true },
  },
  workHistories: {
    select: {
      roleTitle: true,
      companyName: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      outcomes: true,
    },
  },
  learningGoals: {
    select: { skillName: true, status: true },
  },
} as const;

type ProfileRow = NonNullable<
  Awaited<ReturnType<typeof loadProfile>>
>;

function loadProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    select: PROFILE_SELECT,
  });
}

/** Persisted paths for a user. Returns [] if none generated yet — no generation on read. */
export async function getPaths(userId: string): Promise<CareerPath[] | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const rows = await prisma.careerPath.findMany({
    where: { profileId: profile.id },
    orderBy: [{ isActive: "desc" }, { confidenceScore: "desc" }],
  });

  return rows.map(toCareerPath);
}

/**
 * Replace the user's path set with a freshly generated one.
 * Regeneration clears activation by design (paths are disposable).
 * On AI failure after retry, persists rule-based fallback paths instead.
 */
export async function generatePaths(userId: string): Promise<CareerPath[] | null> {
  const context = await assembleAdvisorContext(userId, "paths");
  if (!context) return null;

  const profile = await loadProfile(userId);
  if (!profile) return null;

  const snapshot = toSnapshot(profile);
  const enrichedSnapshot = {
    ...snapshot,
    advisorSignals: {
      winsThisQuarter: context.signals.winsThisQuarter,
      sentimentTrend12w: context.signals.sentimentTrend12w,
      intentionActionGap: context.signals.intentionActionGap,
      memoryFacts: context.memories.map((m) => m.fact),
    },
  };

  let generated: GeneratedPath[];
  try {
    generated = await generateCareerPaths(enrichedSnapshot as PathProfileSnapshot);
  } catch {
    generated = buildFallbackPaths(snapshot);
  }

  const rows = await prisma.$transaction(async (tx) => {
    await tx.careerPath.deleteMany({ where: { profileId: profile.id } });
    await tx.careerPath.createMany({
      data: generated.map((p) => ({
        profileId: profile.id,
        title: p.title,
        description: p.description,
        confidenceScore: p.confidenceScore,
        projectedTimelineMonths: p.projectedTimelineMonths,
        milestones: p.milestones as unknown as Prisma.InputJsonValue,
        isActive: false,
      })),
    });
    return tx.careerPath.findMany({
      where: { profileId: profile.id },
      orderBy: { confidenceScore: "desc" },
    });
  });

  return rows.map(toCareerPath);
}

/** Set one path active and clear the others. Verifies the path belongs to the user. */
export async function activatePath(
  userId: string,
  pathId: string,
): Promise<CareerPath[] | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const path = await prisma.careerPath.findFirst({
    where: { id: pathId, profileId: profile.id },
    select: { id: true },
  });
  if (!path) return null;

  const rows = await prisma.$transaction(async (tx) => {
    await tx.careerPath.updateMany({
      where: { profileId: profile.id },
      data: { isActive: false },
    });
    await tx.careerPath.update({
      where: { id: pathId },
      data: { isActive: true },
    });
    return tx.careerPath.findMany({
      where: { profileId: profile.id },
      orderBy: [{ isActive: "desc" }, { confidenceScore: "desc" }],
    });
  });

  return rows.map(toCareerPath);
}

// --- helpers ---

function toSnapshot(profile: ProfileRow): PathProfileSnapshot {
  return {
    bio: profile.bio,
    targetRole: profile.targetRole,
    location: profile.location,
    yearsOfExperience: profile.yearsOfExperience,
    careerTrajectory: profile.careerTrajectory,
    aspirations: profile.aspirations,
    skills: profile.skills.map((s) => ({
      name: s.name,
      confidenceRating: s.confidenceRating,
    })),
    workHistories: profile.workHistories.map((w) => ({
      roleTitle: w.roleTitle,
      companyName: w.companyName,
      startYear: w.startDate ? new Date(w.startDate).getFullYear() : null,
      endYear: w.isCurrent
        ? "present"
        : w.endDate
          ? new Date(w.endDate).getFullYear()
          : null,
      outcomes: w.outcomes,
    })),
    learningGoals: profile.learningGoals.map((g) => ({
      skillName: g.skillName,
      status: g.status,
    })),
  };
}

function toCareerPath(row: {
  id: string;
  title: string;
  description: string;
  confidenceScore: number;
  projectedTimelineMonths: number;
  milestones: unknown;
  isActive: boolean;
}): CareerPath {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    confidenceScore: row.confidenceScore,
    projectedTimelineMonths: row.projectedTimelineMonths,
    milestones: (row.milestones as Milestone[]) ?? [],
    isActive: row.isActive,
  };
}

/**
 * Rule-based cold-start path so the UI is never empty when AI output fails
 * validation or the profile is too sparse to reason over. Mirrors the
 * insights.service `buildFallbackObservations` fallback.
 */
export function buildFallbackPaths(snapshot: PathProfileSnapshot): GeneratedPath[] {
  const current = snapshot.workHistories.find((w) => w.endYear === "present");
  const startRole = current?.roleTitle ?? "your current role";
  const target = snapshot.targetRole ?? "a senior role in your field";

  const milestones: Milestone[] = [
    {
      order: 1,
      title: "Deepen your core strengths",
      description: `Build on what you already do in ${startRole} — take ownership of a project end-to-end.`,
      estimatedMonthsFromNow: 3,
      salaryBand: { min: 0, max: 0, currency: "USD" },
      requiredSkills: snapshot.skills.slice(0, 3).map((s) => s.name),
      status: "not_started",
    },
    {
      order: 2,
      title: "Broaden your scope",
      description: "Take on responsibility beyond your current remit to demonstrate range.",
      estimatedMonthsFromNow: 9,
      salaryBand: { min: 0, max: 0, currency: "USD" },
      requiredSkills: [],
      status: "not_started",
    },
    {
      order: 3,
      title: `Move toward ${target}`,
      description: `Position yourself for ${target} by closing the gaps that role requires.`,
      estimatedMonthsFromNow: 18,
      salaryBand: { min: 0, max: 0, currency: "USD" },
      requiredSkills: [],
      status: "not_started",
    },
  ];

  return [
    {
      title: `Growth toward ${target}`,
      description:
        "A starting roadmap based on your current profile. Add more skills and history, then regenerate for sharper, personalised paths.",
      confidenceScore: 0.5,
      projectedTimelineMonths: 18,
      milestones,
    },
  ];
}
