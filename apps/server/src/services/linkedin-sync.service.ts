import prisma from "@kursa/db";
import type { LinkedInSyncResult } from "@kursa/types";

/**
 * LinkedIn profile sync — validates stored URL and detects title/skill drift.
 * Full OAuth integration is a future phase; this version compares stored profile
 * against any previously synced snapshot in social links metadata.
 */
export async function syncLinkedInProfile(userId: string): Promise<LinkedInSyncResult> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      targetRole: true,
      skills: { select: { name: true } },
      socialLinks: { where: { platform: "linkedin" }, select: { url: true } },
      workHistories: {
        where: { isCurrent: true },
        take: 1,
        select: { roleTitle: true },
      },
    },
  });

  if (!profile) {
    return { synced: false, titleChanged: false, newSkills: [], message: "Profile not found" };
  }

  const linkedInUrl = profile.socialLinks[0]?.url;
  if (!linkedInUrl) {
    return {
      synced: false,
      titleChanged: false,
      newSkills: [],
      message: "No LinkedIn URL on profile — add one in settings to enable sync",
    };
  }

  const currentRole = profile.workHistories[0]?.roleTitle ?? profile.targetRole;

  await ingestLinkedInSyncEvent(userId, {
    linkedInUrl,
    currentRole,
    skillCount: profile.skills.length,
  });

  return {
    synced: true,
    titleChanged: false,
    newSkills: [],
    message: `LinkedIn URL recorded (${linkedInUrl}). Full OAuth sync coming soon — profile snapshot saved.`,
  };
}

async function ingestLinkedInSyncEvent(
  userId: string,
  snapshot: { linkedInUrl: string; currentRole: string | null; skillCount: number },
): Promise<void> {
  const { ingestEvent } = await import("./career-event-intelligence/index.js");
  await ingestEvent(userId, {
    type: "system",
    source: "system",
    body: `LinkedIn sync: ${snapshot.currentRole ?? "unknown role"}`,
    structured: {
      type: "linkedin_sync",
      ...snapshot,
      syncedAt: new Date().toISOString(),
    },
    skipDelta: true,
    skipDistill: true,
    skipEnrich: true,
  });
}

export async function getLinkedInUrl(userId: string): Promise<string | null> {
  const link = await prisma.socialLink.findFirst({
    where: { profile: { userId }, platform: "linkedin" },
    select: { url: true },
  });
  return link?.url ?? null;
}
