import prisma from "@kursa/db";

import { type DashboardData, computeDashboardMetrics } from "../compute/dashboard.compute.js";
import { assembleAdvisorContext } from "../lib/advisor-context.js";

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

  const context = await assembleAdvisorContext(userId, "journal").catch((err) => {
    console.error("[dashboard] intelligence context failed:", err);
    return null;
  });

  const data: DashboardData = {
    user: { createdAt: user.createdAt },
    profile: user.profile,
    intelligence: context
      ? {
          winsThisQuarter: context.signals.winsThisQuarter,
          checkInStreak: context.signals.checkInStreak,
          journalActivityScore: context.recentEvents.filter((e) =>
            ["win", "note", "feedback"].includes(e.type),
          ).length,
          recentWins: context.recentEvents
            .filter((e) => e.type === "win")
            .slice(0, 3)
            .map((e) => ({
              id: e.id,
              body: e.body?.slice(0, 80) ?? "",
              occurredAt: e.occurredAt,
            })),
          recentEvents: context.recentEvents.map((e) => ({
            id: e.id,
            type: e.type,
            body: e.body,
            occurredAt: e.occurredAt,
          })),
        }
      : null,
  };

  return computeDashboardMetrics(data);
}
