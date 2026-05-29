import prisma from "@kursa/db";
import type { ProfileInput } from "@kursa/types";

import { computeProfileSignals } from "../compute/insight.compute.js";
import { classifyCareerTrajectory } from "../lib/ai/insights.classify.js";
import { generateObservations, type Observation } from "../lib/ai/insights.generate.js";

// Keyed by profileId:updatedAt.getTime() — entries auto-evict when profile changes
const observationCache = new Map<string, Observation[]>();

export async function getObservations(userId: string, page: number, limit: number) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      updatedAt: true,
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
        select: {
          skillName: true,
          deadline: true,
          status: true,
        },
      },
      jobApplications: {
        select: { appliedAt: true },
      },
      socialLinks: true,
    },
  });

  if (!profile) return null;

  // Lazy trajectory classification — computed once from work history, stored on Profile
  let { careerTrajectory } = profile;
  let profileUpdatedAt = profile.updatedAt;

  if (!careerTrajectory && profile.workHistories.length > 0) {
    careerTrajectory = await classifyCareerTrajectory(profile.workHistories);
    const saved = await prisma.profile.update({
      where: { id: profile.id },
      data: { careerTrajectory },
      select: { updatedAt: true },
    });
    profileUpdatedAt = saved.updatedAt;
  }

  const profileInput: ProfileInput = {
    bio: profile.bio,
    targetRole: profile.targetRole,
    location: profile.location,
    yearsOfExperience: profile.yearsOfExperience,
    aspirations: profile.aspirations,
    careerTrajectory,
    skills: profile.skills,
    workHistories: profile.workHistories,
    learningGoals: profile.learningGoals,
    jobApplications: profile.jobApplications,
    socialLinks: profile.socialLinks,
  };

  const signals = computeProfileSignals(profileInput);

  const cacheKey = `${profile.id}:${profileUpdatedAt.getTime()}`;
  let observations = observationCache.get(cacheKey);

  if (!observations) {
    try {
      observations = await generateObservations(signals);
    } catch {
      observations = buildFallbackObservations(signals);
    }
    observationCache.set(cacheKey, observations);
  }

  const total = observations.length;
  const paginated = observations.slice((page - 1) * limit, page * limit);

  return {
    data: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

function buildFallbackObservations(
  signals: ReturnType<typeof computeProfileSignals>,
): Observation[] {
  const obs: Observation[] = [];

  if (signals.dormantHighValueSkills.length > 0) {
    obs.push({
      text: `Your ${signals.dormantHighValueSkills[0]} work has slowed down. You've built strong depth here — worth keeping active.`,
      timeAgo: "noticed · today",
      type: "warning",
    });
  }

  if (signals.overdueGoals.length > 0) {
    const count = signals.overdueGoals.length;
    obs.push({
      text: `${count === 1 ? "One learning goal is" : `${count} learning goals are`} past deadline: ${signals.overdueGoals.slice(0, 2).join(", ")}.`,
      timeAgo: "noticed · today",
      type: "warning",
    });
  }

  if (signals.targetRole && !signals.hasAppliedToTargetRole) {
    obs.push({
      text: `You haven't applied to any ${signals.targetRole} roles yet. Your profile is strong enough to start.`,
      timeAgo: "noticed · today",
      type: "opportunity",
    });
  }

  return obs;
}
