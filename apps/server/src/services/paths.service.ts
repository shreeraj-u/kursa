import prisma, { Prisma } from "@kursa/db";
import type { CareerPath, Milestone } from "@kursa/types";

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
  const profile = await loadProfile(userId);
  if (!profile) return null;

  const snapshot = toSnapshot(profile);

  let generated: GeneratedPath[];
  try {
    generated = await generateCareerPaths(snapshot);
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
        details:
          p.details === null || p.details === undefined
            ? Prisma.JsonNull
            : (p.details as unknown as Prisma.InputJsonValue),
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
  details: unknown;
  milestones: unknown;
  isActive: boolean;
}): CareerPath {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    confidenceScore: row.confidenceScore,
    projectedTimelineMonths: row.projectedTimelineMonths,
    details: row.details as CareerPath["details"],
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
      details: {
        fitReasons: [
          `Your current profile already points toward ${target}.`,
          "The path starts with broad, profile-safe steps until richer career data is available.",
        ],
        skillGaps: snapshot.skills.length
          ? []
          : [
              {
                skill: "Profile depth",
                whyItMatters:
                  "Kursa needs skills and work history to generate sharper, personalised path gaps.",
                priority: "high",
              },
            ],
        nextActions: [
          {
            title: "Add recent work outcomes",
            description:
              "Capture concrete projects, achievements, and metrics so regenerated paths can reason from evidence.",
            timeframe: "this week",
          },
          {
            title: "Pick one near-term proof point",
            description: `Choose a project that demonstrates readiness for ${target}.`,
            timeframe: "next 30 days",
          },
        ],
        risks: [
          {
            risk: "Sparse profile data can make this path generic.",
            mitigation:
              "Update your profile and regenerate paths for more specific recommendations.",
          },
        ],
        evidence: [
          snapshot.targetRole
            ? `Target role: ${snapshot.targetRole}`
            : `Current role context: ${startRole}`,
          snapshot.location
            ? `Location: ${snapshot.location}`
            : "No location preference captured yet",
        ],
      },
      milestones,
    },
  ];
}
