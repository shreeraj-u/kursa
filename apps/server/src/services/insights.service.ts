import prisma from "@kursa/db";
import type { ProfileInput } from "@kursa/types";

import { computeProfileSignals } from "../compute/insight.compute.js";
import { classifyCareerTrajectory } from "../lib/ai/insights.classify.js";
import { generateObservations, type Observation } from "../lib/ai/insights.generate.js";

const MAX_OBSERVATION_CACHE_ENTRIES = 500;

type ObservationCacheEntry = {
  updatedAtMs: number;
  observations: Observation[];
};

type ObservationProfile = {
  bio: ProfileInput["bio"];
  targetRole: ProfileInput["targetRole"];
  location: ProfileInput["location"];
  yearsOfExperience: ProfileInput["yearsOfExperience"];
  aspirations: ProfileInput["aspirations"];
  skills: ProfileInput["skills"];
  workHistories: ProfileInput["workHistories"];
  learningGoals: ProfileInput["learningGoals"];
  jobApplications: ProfileInput["jobApplications"];
  socialLinks: ProfileInput["socialLinks"];
};

// Keyed by profileId so each profile occupies at most one cache slot.
const observationCache = new Map<string, ObservationCacheEntry>();

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

  const cached = getCachedObservations(profile.id, profile.updatedAt.getTime());
  if (cached) return paginateObservations(cached, page, limit);

  const sparseProfile = profile.skills.length < 2 && profile.workHistories.length < 1;
  let profileInput = toProfileInput(profile, profile.careerTrajectory);
  let signals = computeProfileSignals(profileInput);

  if (sparseProfile) {
    const observations = buildFallbackObservations(signals);
    setCachedObservations(profile.id, profile.updatedAt.getTime(), observations);
    return paginateObservations(observations, page, limit);
  }

  let observations: Observation[];
  let profileUpdatedAt = profile.updatedAt;

  try {
    let { careerTrajectory } = profile;

    if (!careerTrajectory && profile.workHistories.length > 0) {
      careerTrajectory = await classifyCareerTrajectory(profile.workHistories);
      const saved = await prisma.profile.update({
        where: { id: profile.id },
        data: { careerTrajectory },
        select: { updatedAt: true },
      });
      profileUpdatedAt = saved.updatedAt;
    }

    profileInput = toProfileInput(profile, careerTrajectory);
    signals = computeProfileSignals(profileInput);
    observations = await generateObservations(signals);
  } catch {
    observations = buildFallbackObservations(signals);
  }

  setCachedObservations(profile.id, profileUpdatedAt.getTime(), observations);
  return paginateObservations(observations, page, limit);
}

function toProfileInput(
  profile: ObservationProfile,
  careerTrajectory: ProfileInput["careerTrajectory"],
): ProfileInput {
  return {
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
}

function getCachedObservations(profileId: string, updatedAtMs: number): Observation[] | null {
  const entry = observationCache.get(profileId);
  if (!entry || entry.updatedAtMs !== updatedAtMs) return null;

  // Refresh insertion order for simple LRU behavior.
  observationCache.delete(profileId);
  observationCache.set(profileId, entry);
  return entry.observations;
}

function setCachedObservations(
  profileId: string,
  updatedAtMs: number,
  observations: Observation[],
) {
  observationCache.delete(profileId);
  observationCache.set(profileId, { updatedAtMs, observations });

  while (observationCache.size > MAX_OBSERVATION_CACHE_ENTRIES) {
    const oldestKey = observationCache.keys().next().value;
    if (!oldestKey) break;
    observationCache.delete(oldestKey);
  }
}

function paginateObservations(observations: Observation[], page: number, limit: number) {
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
