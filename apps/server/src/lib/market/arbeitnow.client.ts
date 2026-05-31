import type { MarketSampleRole } from "@kursa/types";

import { type JobSearchResult, matchesKeyword } from "./job-aggregator.js";

type ArbeitnowJob = {
  slug?: string;
  title?: string;
  company_name?: string;
  location?: string;
  remote?: boolean;
  url?: string;
  created_at?: string;
  tags?: Array<{ name?: string } | string>;
};

export async function searchArbeitnowJobs(
  query: string,
  maxResults = 5,
): Promise<JobSearchResult | null> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: ArbeitnowJob[] };
    const data = json.data ?? (Array.isArray(json) ? (json as ArbeitnowJob[]) : []);
    if (!Array.isArray(data)) return null;

    const filtered = data.filter((j) =>
      matchesKeyword(`${j.title ?? ""} ${j.company_name ?? ""}`, query),
    );

    const roles: MarketSampleRole[] = filtered.slice(0, maxResults).map((j) => ({
      title: j.title ?? "Role",
      company: j.company_name ?? "Company",
      url: j.url ?? `https://www.arbeitnow.com/jobs/${j.slug ?? ""}`,
      postedAt: j.created_at ?? new Date().toISOString(),
    }));

    return {
      roles,
      postingCount: filtered.length,
      source: "arbeitnow",
    };
  } catch {
    return null;
  }
}
