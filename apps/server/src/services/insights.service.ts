// Insight generation for a user's profile.
// Separated from profile.service so observation/AI logic has its own seam.
// TODO: Replace rule-based generation with AI analysis.

import prisma from "@kursa/db";

export async function getObservations(userId: string, page: number, limit: number) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, targetRole: true },
  });

  if (!profile) return null;

  const obs: { text: string; timeAgo: string; type: "opportunity" | "warning" | "info" }[] = [];
  const now = Date.now();
  const sixMonthsAgo = new Date(now - 86400000 * 30 * 6);

  const dormantSkills = await prisma.skill.findMany({
    where: { profileId: profile.id, lastUsedDate: { lt: sixMonthsAgo } },
  });

  dormantSkills.forEach((skill) => {
    obs.push({
      text:
        `Your ${skill.name} work has slowed down. ` +
        (skill.confidenceRating && skill.confidenceRating > 3
          ? "You've built strong depth here — worth keeping active."
          : ""),
      timeAgo: "noticed · today",
      type: "warning",
    });
  });

  const overdueGoals = await prisma.learningGoal.findMany({
    where: { profileId: profile.id, deadline: { lt: new Date() }, status: { not: "COMPLETED" } },
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

  if (profile.targetRole) {
    const applicationsCount = await prisma.jobApplication.count({ where: { profileId: profile.id } });
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
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
