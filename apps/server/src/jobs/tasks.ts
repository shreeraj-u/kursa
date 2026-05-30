import prisma from "@kursa/db";

import { runMemoryDistillation } from "../services/memory.service.js";
import { getObservations } from "../services/insights.service.js";

export async function runNightlyMemoryDistillation(): Promise<void> {
  const profiles = await prisma.profile.findMany({
    where: { onboardingDone: true },
    select: { userId: true, id: true },
    take: 500,
  });

  for (const profile of profiles) {
    try {
      await runMemoryDistillation(profile.userId, profile.id);
    } catch (error) {
      console.error("[jobs] memory distill failed for", profile.userId, error);
    }
  }
}

export async function runObservationRefresh(): Promise<void> {
  const profiles = await prisma.profile.findMany({
    where: { onboardingDone: true },
    select: { userId: true },
    take: 200,
  });

  for (const profile of profiles) {
    try {
      await getObservations(profile.userId, 1, 10);
    } catch (error) {
      console.error("[jobs] observation refresh failed for", profile.userId, error);
    }
  }
}

export async function runCheckInReminders(): Promise<void> {
  // Placeholder: integrate email/in-app notifications when messaging layer exists.
  console.info("[jobs] check-in reminder scan completed");
}

export async function runPathStaleFlags(): Promise<void> {
  const ninetyDaysAgo = new Date(Date.now() - 86400000 * 90);
  const stale = await prisma.careerPath.findMany({
    where: { generatedAt: { lt: ninetyDaysAgo }, isActive: true },
    select: { id: true },
  });
  if (stale.length > 0) {
    console.info(`[jobs] ${stale.length} active paths older than 90 days`);
  }
}
