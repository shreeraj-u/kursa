import prisma from "@kursa/db";
import type { MarketContext, ProfileInput } from "@kursa/types";

import { isMarketTableMissingError } from "../lib/market/safe-market-db.js";
import { refreshMarketSnapshot, roleKey } from "./market-ingest.service.js";

const MARKET_DISABLED = process.env.MARKET_ENABLED === "false";

const inflightRefresh = new Map<string, Promise<MarketContext | null>>();

async function readCachedRow(userId: string, profile: ProfileInput) {
  const key = roleKey(profile.targetRole!, profile.location ?? null);
  return prisma.marketSnapshot.findUnique({
    where: { userId_roleKey: { userId, roleKey: key } },
  });
}

async function getMarketSnapshotWithRefresh(
  userId: string,
  profile: ProfileInput,
): Promise<MarketContext | null> {
  if (MARKET_DISABLED || !profile.targetRole) return null;

  const cacheKey = `${userId}:${roleKey(profile.targetRole, profile.location ?? null)}`;

  try {
    const row = await readCachedRow(userId, profile);
    if (row && row.expiresAt > new Date()) {
      return row.payload as unknown as MarketContext;
    }

    const existing = inflightRefresh.get(cacheKey);
    if (existing) return existing;

    const refreshPromise = (async (): Promise<MarketContext | null> => {
      try {
        return await refreshMarketSnapshot(userId, profile);
      } catch (err) {
        if (isMarketTableMissingError(err)) return null;
        console.error("[market] refresh failed for", userId, err);
        const stale = await readCachedRow(userId, profile);
        return stale ? (stale.payload as unknown as MarketContext) : null;
      } finally {
        inflightRefresh.delete(cacheKey);
      }
    })();

    inflightRefresh.set(cacheKey, refreshPromise);
    return refreshPromise;
  } catch (err) {
    if (isMarketTableMissingError(err)) return null;
    throw err;
  }
}

/** Load profile fields needed for market refresh. */
async function loadProfileForMarket(userId: string): Promise<ProfileInput | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
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
      learningGoals: { select: { skillName: true, deadline: true, status: true } },
      jobApplications: { select: { appliedAt: true } },
      socialLinks: true,
    },
  });
  if (!profile?.targetRole) return null;
  return profile;
}

export async function getMarketContextForProfile(
  userId: string,
  profile: ProfileInput,
): Promise<MarketContext | null> {
  return getMarketSnapshotWithRefresh(userId, profile);
}

export async function getMarketContextForUser(userId: string): Promise<MarketContext | null> {
  const profile = await loadProfileForMarket(userId);
  if (!profile) return null;
  return getMarketSnapshotWithRefresh(userId, profile);
}

/** Read cached market snapshot only — no external API calls (for chat meta, etc.). */
export async function getMarketContextCachedForUser(userId: string): Promise<MarketContext | null> {
  if (MARKET_DISABLED) return null;
  const profile = await loadProfileForMarket(userId);
  if (!profile) return null;
  try {
    const row = await readCachedRow(userId, profile);
    if (!row) return null;
    return row.payload as unknown as MarketContext;
  } catch (err) {
    if (isMarketTableMissingError(err)) return null;
    throw err;
  }
}

/** @deprecated Use getMarketContextForProfile — kept for callers passing profile inline. */
export async function getMarketSnapshotCached(
  userId: string,
  profile: ProfileInput,
): Promise<MarketContext | null> {
  return getMarketContextForProfile(userId, profile);
}

export async function runMarketRefreshForAllUsers(): Promise<void> {
  if (MARKET_DISABLED) return;
  const profiles = await prisma.profile.findMany({
    where: { targetRole: { not: null } },
    select: {
      userId: true,
      targetRole: true,
      location: true,
      skills: {
        select: {
          name: true,
          lastUsedDate: true,
          confidenceRating: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      workHistories: true,
      learningGoals: true,
      jobApplications: true,
      socialLinks: true,
      bio: true,
      yearsOfExperience: true,
      aspirations: true,
      careerTrajectory: true,
    },
    take: 200,
  });

  for (const p of profiles) {
    const profile: ProfileInput = {
      bio: p.bio,
      targetRole: p.targetRole,
      location: p.location,
      yearsOfExperience: p.yearsOfExperience,
      aspirations: p.aspirations,
      careerTrajectory: p.careerTrajectory,
      skills: p.skills,
      workHistories: p.workHistories,
      learningGoals: p.learningGoals,
      jobApplications: p.jobApplications,
      socialLinks: p.socialLinks,
    };
    try {
      await refreshMarketSnapshot(p.userId, profile);
    } catch (err) {
      console.error("[market] batch refresh failed", p.userId, err);
    }
  }
}
