import prisma from "@kursa/db";

import { type DashboardData, computeDashboardMetrics } from "../compute/dashboard.compute.js";

export async function getDashboardMetrics(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: true,
          workHistories: true,
          learningGoals: true,
          jobApplications: true,
          socialLinks: true,
        },
      },
    },
  });

  if (!user || !user.profile) return null;

  const data: DashboardData = {
    user: { createdAt: user.createdAt },
    profile: user.profile,
  };

  return computeDashboardMetrics(data);
}
