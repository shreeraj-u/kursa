import { createHash } from "node:crypto";

import prisma from "@kursa/db";
import type { AdvisorContext, AdvisorPurpose, ProfileInput } from "@kursa/types";
import type { CareerJourney } from "@kursa/types";

import { computeAdvisorSignals, shouldRegeneratePaths } from "../compute/advisor.compute.js";
import {
  getAdvisorEventWindow,
  getRecentEvents,
  selectAdvisorSignalEvents,
} from "../services/career-event-intelligence/index.js";
import { getMemoriesForUser } from "../services/memory.service.js";
import { getGitHubSnapshot } from "../services/github-sync.service.js";
import { getMarketContextForProfile } from "../services/market.service.js";

const PROFILE_SELECT = {
  bio: true,
  targetRole: true,
  location: true,
  yearsOfExperience: true,
  aspirations: true,
  careerTrajectory: true,
  skills: {
    select: {
      name: true,
      confidenceRating: true,
      lastUsedDate: true,
      createdAt: true,
      updatedAt: true,
    },
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
    select: { skillName: true, deadline: true, status: true },
  },
  jobApplications: {
    select: { appliedAt: true },
  },
  socialLinks: true,
} as const;

export async function assembleAdvisorContext(
  userId: string,
  purpose: AdvisorPurpose,
): Promise<AdvisorContext | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      ...PROFILE_SELECT,
      careerPaths: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  if (!profile) return null;

  const since = await getAdvisorEventWindow(userId);
  const [rawEvents, memories] = await Promise.all([
    getRecentEvents(userId, since, purpose === "paths" ? 100 : 40),
    getMemoriesForUser(userId, purpose === "chat" ? 20 : 10),
  ]);

  // Aria's own outputs must not feed back into signals or cache invalidation.
  const recentEvents = selectAdvisorSignalEvents(rawEvents);

  const profileInput: ProfileInput = {
    bio: profile.bio,
    targetRole: profile.targetRole,
    location: profile.location,
    yearsOfExperience: profile.yearsOfExperience,
    aspirations: profile.aspirations,
    careerTrajectory: profile.careerTrajectory,
    skills: profile.skills,
    workHistories: profile.workHistories,
    learningGoals: profile.learningGoals,
    jobApplications: profile.jobApplications,
    socialLinks: profile.socialLinks,
  };

  const activePathRow = profile.careerPaths[0];
  const activePath: CareerJourney | null = activePathRow
    ? {
        id: activePathRow.id,
        profileId: activePathRow.profileId,
        title: activePathRow.title,
        description: activePathRow.description,
        confidenceScore: activePathRow.confidenceScore,
        projectedTimelineMonths: activePathRow.projectedTimelineMonths,
        milestones: activePathRow.milestones as unknown as CareerJourney["milestones"],
        details: activePathRow.details as unknown as CareerJourney["details"],
      }
    : null;

  const signals = computeAdvisorSignals(
    profileInput,
    recentEvents,
    memories,
    activePath,
  );

  const githubActivityRecent = recentEvents.find((e) => {
    if (e.type !== "github_activity") return false;
    const age = Date.now() - new Date(e.occurredAt).getTime();
    return age < 86400000 * 2;
  });
  const githubMaterialChange = Boolean(
    githubActivityRecent &&
    typeof githubActivityRecent.structured === "object" &&
    githubActivityRecent.structured !== null &&
    (
      (Array.isArray((githubActivityRecent.structured as { newlyActiveRepos?: unknown }).newlyActiveRepos) &&
        ((githubActivityRecent.structured as { newlyActiveRepos: string[] }).newlyActiveRepos.length > 0)) ||
      (Array.isArray((githubActivityRecent.structured as { languageShifts?: unknown }).languageShifts) &&
        ((githubActivityRecent.structured as { languageShifts: unknown[] }).languageShifts.length > 0))
    ),
  );

  const materialChangeDetected = shouldRegeneratePaths(signals) || githubMaterialChange;

  const BUDGETS: Record<AdvisorPurpose, { events: number; skills: number }> = {
    chat:         { events: 8,                   skills: 15 },
    journal:      { events: 10,                  skills: Infinity },
    paths:        { events: recentEvents.length, skills: Infinity },
    observations: { events: 15,                  skills: Infinity },
  };

  const budget = BUDGETS[purpose];

  // Market refresh is slow (external APIs). Only load for chat and path generation.
  const marketContext =
    purpose === "chat" || purpose === "paths"
      ? await getMarketContextForProfile(userId, profileInput)
      : null;

  const githubSnapshot = await getGitHubSnapshot(userId).catch(() => null);
  const githubSlice = githubSnapshot
    ? {
        username: githubSnapshot.profile.login,
        lastActiveAt: githubSnapshot.workPatterns.lastActiveAt,
        pushVelocity: githubSnapshot.workPatterns.pushVelocity,
        activeRepoNames: githubSnapshot.workPatterns.activeRepos.slice(0, 3).map((r) => r.name),
        primaryLanguages: githubSnapshot.workPatterns.languageMix.slice(0, 4).map((l) => l.language),
        frameworkSignals: githubSnapshot.workPatterns.frameworkSignals.slice(0, 6),
      }
    : null;

  return {
    purpose,
    profile: {
      ...profileInput,
      skills: profileInput.skills.slice(0, budget.skills),
    },
    signals,
    recentEvents: recentEvents.slice(0, budget.events),
    memories: memories.slice(0, purpose === "observations" ? 5 : memories.length),
    activePath,
    materialChangeDetected,
    marketContext,
    githubSlice,
  };
}

export function hashAdvisorContext(context: AdvisorContext): string {
  const payload = JSON.stringify({
    signals: context.signals,
    memoryIds: context.memories.map((m) => m.id),
    eventIds: context.recentEvents.map((e) => e.id),
    profileUpdated: context.profile.skills.map((s) => s.updatedAt),
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}
