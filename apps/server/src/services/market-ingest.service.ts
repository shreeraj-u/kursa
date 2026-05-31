import { createHash } from "node:crypto";

import prisma from "@kursa/db";
import type { MarketContext, ProfileInput } from "@kursa/types";

import { computeMarketGaps } from "../compute/gap-analysis.compute.js";
import { searchAdzunaJobs } from "../lib/market/adzuna.client.js";
import { searchArbeitnowJobs } from "../lib/market/arbeitnow.client.js";
import { fetchBlsWagesForRole } from "../lib/market/bls.client.js";
import {
  fetchCareerOneStopWages,
  searchCareerOneStopJobs,
} from "../lib/market/careeronestop.client.js";
import { mergeJobResults } from "../lib/market/job-aggregator.js";
import { onetCodeToSoc, searchOnetOccupation } from "../lib/market/onet.client.js";
import { searchRemoteOkJobs } from "../lib/market/remoteok.client.js";
import { isMarketTableMissingError } from "../lib/market/safe-market-db.js";

function roleKey(targetRole: string, location: string | null): string {
  return createHash("sha256")
    .update(`${targetRole}|${location ?? ""}`)
    .digest("hex")
    .slice(0, 24);
}

function parseLocation(location: string | null): MarketContext["location"] {
  if (!location?.trim()) return { country: "US" };
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return { city: parts[0], region: parts[1], country: parts[2] ?? "US" };
  }
  return { city: parts[0], country: "US" };
}

function skillFrequencyFromTitles(
  titles: string[],
  profileSkills: string[],
): Array<{ skill: string; frequencyPct: number }> {
  const counts = new Map<string, number>();
  const corpus = titles.join(" ").toLowerCase();
  for (const skill of profileSkills) {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(corpus)) counts.set(skill, (counts.get(skill) ?? 0) + 1);
  }
  const total = titles.length || 1;
  return [...counts.entries()]
    .map(([skill, n]) => ({ skill, frequencyPct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.frequencyPct - a.frequencyPct);
}

const CACHE_TTL_MS =
  process.env.NODE_ENV === "development"
    ? 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

export function isMarketAvailable(sources: string[], jobCount: number): boolean {
  if (jobCount > 0) return true;
  if (sources.some((s) => s !== "heuristic_wage")) return true;
  return sources.includes("heuristic_wage");
}

export async function refreshMarketSnapshot(
  userId: string,
  profile: ProfileInput,
): Promise<MarketContext> {
  const targetRole = profile.targetRole ?? "Software Engineer";
  const location = profile.location ?? null;
  const key = roleKey(targetRole, location);
  const loc = parseLocation(location);
  const locationStr = location ?? "United States";
  const sources: string[] = [];

  const [onetResult, cosWages, cosJobs, adzuna, remoteOk, arbeitnow] = await Promise.allSettled([
    searchOnetOccupation(targetRole),
    fetchCareerOneStopWages(targetRole, locationStr),
    searchCareerOneStopJobs(targetRole, locationStr, 5),
    searchAdzunaJobs(targetRole, locationStr),
    searchRemoteOkJobs(targetRole, 5),
    searchArbeitnowJobs(targetRole, 5),
  ]);

  const onet = onetResult.status === "fulfilled" ? onetResult.value : null;
  if (onet) sources.push("onet");

  const adzunaJobs =
    adzuna.status === "fulfilled" && adzuna.value
      ? { ...adzuna.value, source: "adzuna" as const }
      : null;

  const mergedJobs = mergeJobResults(
    [
      cosJobs.status === "fulfilled" ? cosJobs.value : null,
      adzunaJobs,
      remoteOk.status === "fulfilled" ? remoteOk.value : null,
      arbeitnow.status === "fulfilled" ? arbeitnow.value : null,
    ],
    8,
  );
  for (const s of mergedJobs.sources) {
    if (!sources.includes(s)) sources.push(s);
  }

  const socCode = onet ? onetCodeToSoc(onet.code) : null;

  let salary: MarketContext["salary"];
  const cosWage = cosWages.status === "fulfilled" ? cosWages.value : null;
  if (cosWage) {
    salary = cosWage;
    if (!sources.includes("careeronestop")) sources.push("careeronestop");
  } else {
    const bls = await fetchBlsWagesForRole(
      targetRole,
      process.env.BLS_API_KEY,
      socCode,
    );
    if (bls) {
      salary = bls;
      if (process.env.BLS_API_KEY?.trim()) {
        if (!sources.includes("bls_oews")) sources.push("bls_oews");
      } else {
        if (!sources.includes("heuristic_wage")) sources.push("heuristic_wage");
      }
    }
  }

  if (mergedJobs.salaryMin && mergedJobs.salaryMax && !salary) {
    salary = {
      p25: mergedJobs.salaryMin,
      p50: Math.round((mergedJobs.salaryMin + mergedJobs.salaryMax) / 2),
      p75: mergedJobs.salaryMax,
      currency: "USD",
    };
  }

  const skillNames = profile.skills.map((s) => s.name);
  const topSkills =
    mergedJobs.roles.length > 0
      ? skillFrequencyFromTitles(
          mergedJobs.roles.map((r) => r.title),
          skillNames,
        )
      : [];

  const gaps = computeMarketGaps(profile, topSkills);

  const postingCount = mergedJobs.postingCount;
  const demandTrend =
    postingCount > 50 ? "rising" : postingCount > 10 ? "stable" : ("declining" as const);

  const available = isMarketAvailable(sources, mergedJobs.roles.length);

  const context: MarketContext = {
    asOf: new Date().toISOString(),
    sources: [...new Set(sources)],
    available,
    role: { title: onet?.title ?? targetRole, onetCode: onet?.code },
    location: loc,
    salary,
    demand: {
      postingCount30d: postingCount || undefined,
      trend: demandTrend,
      topSkills,
    },
    gaps: gaps.length > 0 ? gaps : undefined,
    sampleRoles: mergedJobs.roles.length > 0 ? mergedJobs.roles : undefined,
  };

  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

  try {
    await prisma.marketSnapshot.upsert({
      where: { userId_roleKey: { userId, roleKey: key } },
      create: {
        userId,
        roleKey: key,
        payload: context as object,
        sources: context.sources,
        asOf: new Date(context.asOf),
        expiresAt,
      },
      update: {
        payload: context as object,
        sources: context.sources,
        asOf: new Date(context.asOf),
        expiresAt,
      },
    });

    if (mergedJobs.roles.length > 0) {
      await prisma.jobListing.deleteMany({
        where: { userId, createdAt: { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
      });
      for (const role of mergedJobs.roles) {
        await prisma.jobListing.create({
          data: {
            userId,
            title: role.title,
            company: role.company,
            url: role.url,
            location: location ?? undefined,
            postedAt: new Date(role.postedAt),
          },
        });
      }
    }
  } catch (err) {
    if (isMarketTableMissingError(err)) {
      console.warn("[market] tables missing — run packages/db migration for market_snapshot");
      return { ...context, available: false, sources: [] };
    }
    throw err;
  }

  return context;
}

export { roleKey };
