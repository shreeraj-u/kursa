import type { MarketSampleRole } from "@kursa/types";

import { type JobSearchResult } from "./job-aggregator.js";

const BASE = "https://api.careeronestop.org/v1";

function credentials(): { userId: string; token: string } | null {
  const userId = process.env.CAREERONESTOP_USER_ID?.trim();
  const token = process.env.CAREERONESTOP_API_TOKEN?.trim();
  if (!userId || !token) return null;
  return { userId, token };
}

function authHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface CareerOneStopWages {
  p25: number;
  p50: number;
  p75: number;
  currency: "USD";
}

export async function fetchCareerOneStopWages(
  keyword: string,
  location: string,
): Promise<CareerOneStopWages | null> {
  const creds = credentials();
  if (!creds || !keyword.trim()) return null;

  const loc = location.trim() || "United States";
  const url = `${BASE}/comparesalaries/${encodeURIComponent(creds.userId)}/wage?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(loc)}&enableMetaData=false`;

  try {
    const res = await fetch(url, {
      headers: authHeaders(creds.token),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      OccupationDetail?: Array<{
        Wages?: {
          NationalWagesList?: Array<{ RateType?: string; Median?: number }>;
          BLSAreaWagesList?: Array<{ RateType?: string; Median?: number }>;
        };
      }>;
    };

    const wages = data.OccupationDetail?.[0]?.Wages;
    const list = wages?.BLSAreaWagesList ?? wages?.NationalWagesList ?? [];
    const annual = list.find((w) => w.RateType === "Annual" || w.RateType === "annual");
    const median = annual?.Median;
    if (median == null || !Number.isFinite(median) || median <= 0) return null;

    return {
      p25: Math.round(median * 0.82),
      p50: Math.round(median),
      p75: Math.round(median * 1.2),
      currency: "USD",
    };
  } catch {
    return null;
  }
}

export async function searchCareerOneStopJobs(
  keyword: string,
  location: string,
  maxResults = 5,
): Promise<JobSearchResult | null> {
  const creds = credentials();
  if (!creds || !keyword.trim()) return null;

  const loc = location.trim() || "United States";
  const path = [
    "jobsearch",
    encodeURIComponent(creds.userId),
    encodeURIComponent(keyword),
    encodeURIComponent(loc),
    "25",
    "date",
    "desc",
    "0",
    String(Math.min(maxResults, 25)),
    "30",
  ].join("/");

  const url = `${BASE}/${path}?showFilters=false`;

  try {
    const res = await fetch(url, {
      headers: authHeaders(creds.token),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      TotalCount?: number;
      Jobs?: Array<{
        JobTitle?: string;
        Company?: string;
        URL?: string;
        AcquisitionDate?: string;
      }>;
    };

    const jobs = data.Jobs ?? [];
    const roles: MarketSampleRole[] = jobs.slice(0, maxResults).map((j) => ({
      title: j.JobTitle ?? "Role",
      company: j.Company ?? "Company",
      url: j.URL ?? "https://www.careeronestop.org",
      postedAt: j.AcquisitionDate ?? new Date().toISOString(),
    }));

    return {
      roles,
      postingCount: data.TotalCount ?? jobs.length,
      source: "careeronestop",
    };
  } catch {
    return null;
  }
}
