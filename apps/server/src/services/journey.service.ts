import prisma, { Prisma } from "@kursa/db";
import type {
  CareerJourney,
  CareerJourneyResponse,
  JourneyActionItem,
  JourneyMilestone,
  JourneyUrgency,
  MilestoneStatus,
} from "@kursa/types";

import { assembleAdvisorContext } from "../lib/advisor-context.js";
import {
  extendCareerJourney,
  generateCareerJourney,
  type GeneratedJourney,
  type GeneratedMilestone,
  type JourneyProfileSnapshot,
} from "../lib/ai/journey.generate.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

type ProfileRow = NonNullable<Awaited<ReturnType<typeof loadProfile>>>;

function loadProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    select: PROFILE_SELECT,
  });
}

/** The user's single career journey. Returns null if the profile doesn't exist. */
async function loadJourneyRow(profileId: string) {
  // The DB still models a CareerPath set with an isActive flag; the journey is
  // always the active one. Newest-active wins if multiple ever exist.
  return prisma.careerPath.findFirst({
    where: { profileId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Generate the user's single best-fit career journey.
 * Replaces any existing journey. On AI failure after retry, persists a
 * rule-based fallback journey instead.
 */
export async function generateJourney(userId: string): Promise<CareerJourney | null> {
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

  let generated: GeneratedJourney;
  try {
    generated = await generateCareerJourney(enrichedSnapshot as JourneyProfileSnapshot);
  } catch {
    generated = buildFallbackJourney(snapshot);
  }

  const row = await prisma.$transaction(async (tx) => {
    await tx.careerPath.deleteMany({ where: { profileId: profile.id } });
    return tx.careerPath.create({
      data: {
        profileId: profile.id,
        title: generated.title,
        description: generated.description,
        confidenceScore: generated.confidenceScore,
        projectedTimelineMonths: generated.projectedTimelineMonths,
        details:
          generated.details === null || generated.details === undefined
            ? Prisma.JsonNull
            : (generated.details as unknown as Prisma.InputJsonValue),
        milestones: generated.milestones as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  });

  return toCareerJourney(row);
}

export async function updateMilestoneStatus(
  userId: string,
  milestoneOrder: number,
  status: MilestoneStatus | null,
): Promise<CareerJourney | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const journeyRow = await loadJourneyRow(profile.id);
  if (!journeyRow) return null;

  const milestones = (journeyRow.milestones as unknown as JourneyMilestone[]).map((m) => {
    if (m.order !== milestoneOrder) return m;
    if (status === null) {
      const { manuallySet: _, ...rest } = m;
      return { ...rest, manuallySet: false };
    }
    return { ...m, status, manuallySet: true };
  });

  const updated = await prisma.careerPath.update({
    where: { id: journeyRow.id },
    data: { milestones: milestones as unknown as Prisma.InputJsonValue },
  });

  // When every milestone is completed, extend the journey with new ones.
  const allCompleted =
    milestones.length > 0 && milestones.every((m) => m.status === "completed");
  if (allCompleted) {
    const extended = await autoExtend(userId);
    if (extended) return extended;
  }

  return toCareerJourney(updated);
}

/**
 * Append AI-generated continuation milestones to the user's journey once all
 * existing milestones are completed. Does not replace the journey. Returns the
 * updated journey, or the unchanged journey if extension fails.
 */
export async function autoExtend(userId: string): Promise<CareerJourney | null> {
  const profile = await loadProfile(userId);
  if (!profile) return null;

  const journeyRow = await loadJourneyRow(profile.id);
  if (!journeyRow) return null;

  const existing = (journeyRow.milestones as unknown as JourneyMilestone[]) ?? [];
  const snapshot = toSnapshot(profile);

  let newMilestones: GeneratedMilestone[];
  try {
    newMilestones = await extendCareerJourney(snapshot, {
      title: journeyRow.title,
      description: journeyRow.description,
      milestones: existing,
    });
  } catch {
    return toCareerJourney(journeyRow);
  }

  const lastMonths = existing.reduce(
    (max, m) => Math.max(max, m.estimatedMonthsFromNow),
    0,
  );

  // Keep new milestones strictly after the completed ones, re-number, and append.
  const appended: JourneyMilestone[] = newMilestones
    .sort((a, b) => a.estimatedMonthsFromNow - b.estimatedMonthsFromNow)
    .map((m, i) => ({
      order: existing.length + i + 1,
      title: m.title,
      description: m.description,
      estimatedMonthsFromNow: Math.max(m.estimatedMonthsFromNow, lastMonths + 1),
      salaryBand: m.salaryBand,
      requiredSkills: m.requiredSkills,
      status: "not_started" as const,
    }));

  const merged = [...existing, ...appended];
  const newTimeline = appended.reduce(
    (max, m) => Math.max(max, m.estimatedMonthsFromNow),
    journeyRow.projectedTimelineMonths,
  );

  const updated = await prisma.careerPath.update({
    where: { id: journeyRow.id },
    data: {
      milestones: merged as unknown as Prisma.InputJsonValue,
      projectedTimelineMonths: newTimeline,
    },
  });

  return toCareerJourney(updated);
}

/**
 * The user's career journey plus a server-computed timeline and action queue.
 * Returns nulls/empties when the profile or journey doesn't exist yet.
 */
export async function getJourney(userId: string): Promise<CareerJourneyResponse> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      careerPaths: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      learningGoals: {
        where: { status: { in: ["PLANNED", "LEARNING"] } },
      },
      jobApplications: {
        where: { status: "active", nextActionAt: { not: null } },
        orderBy: { nextActionAt: "asc" },
      },
    },
  });

  if (!profile) {
    return { journey: null, timeline: [], actionQueue: [] };
  }

  const journeyRow = profile.careerPaths[0] ?? null;
  if (!journeyRow) {
    return { journey: null, timeline: [], actionQueue: [] };
  }

  const journey = toCareerJourney(journeyRow);
  const timeline = buildTimeline(journey.milestones);
  const actionQueue = buildActionQueue({
    timeline,
    details: journey.details,
    learningGoals: profile.learningGoals,
    jobApplications: profile.jobApplications,
  });

  return { journey, timeline, actionQueue };
}

// --- timeline + action queue ---

function buildTimeline(milestones: JourneyMilestone[]): JourneyMilestone[] {
  return [...milestones]
    .sort((a, b) => a.estimatedMonthsFromNow - b.estimatedMonthsFromNow)
    .map((m) => {
      const targetDate = targetDateFromMonths(m.estimatedMonthsFromNow);
      return {
        ...m,
        targetDate: targetDate.toISOString(),
        daysRemaining: daysFromNow(targetDate),
      };
    });
}

function buildActionQueue({
  timeline,
  details,
  learningGoals,
  jobApplications,
}: {
  timeline: JourneyMilestone[];
  details: CareerJourney["details"];
  learningGoals: Array<{ skillName: string; deadline: Date | null }>;
  jobApplications: Array<{
    roleTitle: string;
    company: string;
    nextAction: string | null;
    nextActionAt: Date | null;
  }>;
}): JourneyActionItem[] {
  const actionQueue: JourneyActionItem[] = [];

  // Journey: milestones in_progress or not_started within 60 days
  for (const m of timeline) {
    if (m.status === "completed") continue;
    const days = m.daysRemaining ?? null;
    if (days !== null && days > 60) continue;
    actionQueue.push({
      domain: "path",
      urgency: urgencyFromDays(days),
      title: m.title,
      subtitle: `Milestone · ${days !== null && days <= 0 ? "overdue" : `${days}d remaining`}`,
      daysRemaining: days,
      linkTo: "/dashboard/career-journey",
    });
  }

  // Journey: nextActions from journey details (no deadline → "later")
  for (const action of details?.nextActions ?? []) {
    actionQueue.push({
      domain: "path",
      urgency: "later",
      title: action.title,
      subtitle: action.description,
      daysRemaining: null,
      linkTo: "/dashboard/career-journey",
    });
  }

  // Skills: high-priority gaps not covered by an active learning goal
  const activeGoalNames = new Set(learningGoals.map((g) => g.skillName.toLowerCase()));
  for (const gap of details?.skillGaps ?? []) {
    if (gap.priority !== "high") continue;
    if (activeGoalNames.has(gap.skill.toLowerCase())) continue;
    actionQueue.push({
      domain: "skill",
      urgency: "important",
      title: gap.skill,
      subtitle: gap.whyItMatters,
      daysRemaining: null,
      linkTo: "/dashboard/skills",
    });
  }

  // Skills: active learning goals with a deadline
  for (const goal of learningGoals) {
    if (!goal.deadline) continue;
    const days = daysFromNow(new Date(goal.deadline));
    actionQueue.push({
      domain: "skill",
      urgency: urgencyFromDays(days, "important"),
      title: goal.skillName,
      subtitle: `Learning goal · ${days <= 0 ? "overdue" : `${days}d remaining`}`,
      daysRemaining: days,
      linkTo: "/dashboard/skills",
    });
  }

  // Applications: active with a nextActionAt
  for (const app of jobApplications) {
    if (!app.nextActionAt) continue;
    const days = daysFromNow(app.nextActionAt);
    actionQueue.push({
      domain: "application",
      urgency: urgencyFromDays(days),
      title: `${app.roleTitle} @ ${app.company}`,
      subtitle: app.nextAction ?? "Follow up",
      daysRemaining: days,
      linkTo: "/dashboard/applications",
    });
  }

  return sortQueue(actionQueue);
}

function daysFromNow(date: Date | string): number {
  const target = new Date(date);
  return Math.round((target.getTime() - Date.now()) / MS_PER_DAY);
}

function targetDateFromMonths(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

function urgencyFromDays(
  days: number | null,
  fallback: JourneyUrgency = "later",
): JourneyUrgency {
  if (days === null) return fallback;
  if (days <= 7) return "urgent";
  if (days <= 30) return "important";
  return "later";
}

function sortQueue(items: JourneyActionItem[]): JourneyActionItem[] {
  const ORDER: Record<JourneyUrgency, number> = { urgent: 0, important: 1, later: 2 };
  return items.sort((a, b) => {
    const urgencyDiff = ORDER[a.urgency] - ORDER[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    const aD = a.daysRemaining ?? 9999;
    const bD = b.daysRemaining ?? 9999;
    return aD - bD;
  });
}

// --- helpers ---

function toSnapshot(profile: ProfileRow): JourneyProfileSnapshot {
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

function toCareerJourney(row: {
  id: string;
  profileId: string;
  title: string;
  description: string;
  confidenceScore: number;
  projectedTimelineMonths: number;
  details: unknown;
  milestones: unknown;
}): CareerJourney {
  return {
    id: row.id,
    profileId: row.profileId,
    title: row.title,
    description: row.description,
    confidenceScore: row.confidenceScore,
    projectedTimelineMonths: row.projectedTimelineMonths,
    details: row.details as CareerJourney["details"],
    milestones: (row.milestones as JourneyMilestone[]) ?? [],
  };
}

/**
 * Rule-based cold-start journey so the UI is never empty when AI output fails
 * validation or the profile is too sparse to reason over.
 */
export function buildFallbackJourney(snapshot: JourneyProfileSnapshot): GeneratedJourney {
  const current = snapshot.workHistories.find((w) => w.endYear === "present");
  const startRole = current?.roleTitle ?? "your current role";
  const target = snapshot.targetRole ?? "a senior role in your field";

  const milestones: JourneyMilestone[] = [
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

  return {
    title: `Growth toward ${target}`,
    description:
      "A starting journey based on your current profile. Add more skills and history, then regenerate for a sharper, personalised journey.",
    confidenceScore: 0.5,
    projectedTimelineMonths: 18,
    details: {
      fitReasons: [
        `Your current profile already points toward ${target}.`,
        "The journey starts with broad, profile-safe steps until richer career data is available.",
      ],
      skillGaps: snapshot.skills.length
        ? []
        : [
            {
              skill: "Profile depth",
              whyItMatters:
                "Kursa needs skills and work history to generate sharper, personalised journey gaps.",
              priority: "high",
            },
          ],
      nextActions: [
        {
          title: "Add recent work outcomes",
          description:
            "Capture concrete projects, achievements, and metrics so a regenerated journey can reason from evidence.",
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
          risk: "Sparse profile data can make this journey generic.",
          mitigation:
            "Update your profile and regenerate your journey for more specific recommendations.",
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
  };
}
