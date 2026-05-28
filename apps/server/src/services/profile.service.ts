import prisma, { Prisma } from "@kursa/db";

import type { ProfileUpdateInput } from "../validators/profile.validator.js";

const PROFILE_INCLUDE = {
  skills: true,
  workHistories: true,
  educations: true,
  achievements: true,
  projects: true,
  languages: true,
  workAuthorizations: true,
  constraints: true,
  learningGoals: true,
  socialLinks: true,
  jobApplications: true,
} as const;

/**
 * Returns the full profile for a given user, or null if none exists yet.
 */
export async function getProfile(userId: string): Promise<Prisma.ProfileGetPayload<{ include: typeof PROFILE_INCLUDE }> | null> {
  return prisma.profile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });
}

/**
 * Creates or updates the profile for a given user.
 * Returns the updated profile (without nested relations — caller can re-fetch if needed).
 */
export async function upsertProfile(userId: string, data: ProfileUpdateInput) {
  const updateData = {
    ...data,
    aspirations: data.aspirations === null ? Prisma.JsonNull : data.aspirations,
    values: data.values === null ? Prisma.JsonNull : data.values,
  };

  return prisma.profile.upsert({
    where: { userId },
    update: updateData,
    create: { userId, ...updateData },
  });
}

/**
 * Computes and returns paginated observations for a user profile.
 * TODO: Use AI for this analysis 
 */
export async function getObservations(userId: string, page: number, limit: number) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, targetRole: true }
  });

  if (!profile) return null;

  const obs: { text: string; timeAgo: string; type: "opportunity" | "warning" | "info" }[] = [];
  const now = Date.now();
  const sixMonthsAgo = new Date(now - 86400000 * 30 * 6);

  // Dormant skills
  const dormantSkills = await prisma.skill.findMany({
    where: { profileId: profile.id, lastUsedDate: { lt: sixMonthsAgo } }
  });

  dormantSkills.forEach((skill) => {
    obs.push({
      text: `Your ${skill.name} work has slowed down. ` +
        (skill.confidenceRating && skill.confidenceRating > 3
          ? "You've built strong depth here — worth keeping active."
          : ""),
      timeAgo: "noticed · today",
      type: "warning",
    });
  });

  // Overdue goals
  const overdueGoals = await prisma.learningGoal.findMany({
    where: { profileId: profile.id, deadline: { lt: new Date() }, status: { not: "COMPLETED" } }
  });

  if (overdueGoals.length > 0) {
    obs.push({
      text: `${overdueGoals.length === 1 ? "One learning goal is" : `${overdueGoals.length} learning goals are`} past deadline: ${overdueGoals
        .slice(0, 2)
        .map((g) => g.skillName)
        .join(", ")}.`,
      timeAgo: "noticed · today",
      type: "warning",
    });
  }

  // Opportunity
  if (profile.targetRole) {
    const applicationsCount = await prisma.jobApplication.count({
      where: { profileId: profile.id }
    });
    if (applicationsCount === 0) {
      obs.push({
        text: `You haven't applied to any ${profile.targetRole} roles yet. Your profile is strong enough to start.`,
        timeAgo: "noticed · today",
        type: "opportunity",
      });
    }
  }

  const total = obs.length;
  const paginatedObs = obs.slice((page - 1) * limit, page * limit);

  return {
    data: paginatedObs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}
