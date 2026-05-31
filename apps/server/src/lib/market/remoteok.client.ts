import type { MarketSampleRole } from "@kursa/types";

import { type JobSearchResult, keywordsFromRoleTitle, matchesKeyword } from "./job-aggregator.js";

type RemoteOkRow = {
  id?: number | string;
  position?: string;
  company?: string;
  location?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  tags?: string[];
  salary_min?: number;
  salary_max?: number;
};

export async function searchRemoteOkJobs(
  query: string,
  maxResults = 5,
): Promise<JobSearchResult | null> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as RemoteOkRow[];
    if (!Array.isArray(data)) return null;

    const tags = keywordsFromRoleTitle(query);
    const jobs = data.filter(
      (row) =>
        row.id != null &&
        typeof row.position === "string" &&
        (tags.length === 0 ||
          row.tags?.some((t) => tags.includes(t.toLowerCase())) ||
          matchesKeyword(`${row.position} ${row.company ?? ""}`, query)),
    );

    const roles: MarketSampleRole[] = jobs.slice(0, maxResults).map((r) => ({
      title: r.position ?? "Role",
      company: r.company ?? "Company",
      url: r.url ?? r.apply_url ?? "https://remoteok.com",
      postedAt: r.date ?? new Date().toISOString(),
    }));

    const withSalary = jobs.filter((r) => r.salary_min || r.salary_max);
    const mins = withSalary.map((r) => r.salary_min).filter((n): n is number => typeof n === "number");
    const maxs = withSalary.map((r) => r.salary_max).filter((n): n is number => typeof n === "number");

    return {
      roles,
      postingCount: jobs.length,
      salaryMin: mins.length ? Math.min(...mins) : undefined,
      salaryMax: maxs.length ? Math.max(...maxs) : undefined,
      source: "remoteok",
    };
  } catch {
    return null;
  }
}
