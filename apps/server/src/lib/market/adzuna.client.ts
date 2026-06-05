import type { MarketSampleRole } from "@kursa/types";

export interface AdzunaSearchResult {
  roles: MarketSampleRole[];
  postingCount: number;
  salaryMin?: number;
  salaryMax?: number;
}

export async function searchAdzunaJobs(
  query: string,
  location: string,
  country = "us",
): Promise<AdzunaSearchResult | null> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey || !query.trim()) return null;

  const where = location.trim() || "United States";
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query,
    where,
    results_per_page: "8",
    content_type: "application/json",
  });

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      count?: number;
      results?: Array<{
        title?: string;
        company?: { display_name?: string };
        redirect_url?: string;
        created?: string;
        salary_min?: number;
        salary_max?: number;
      }>;
    };

    const results = data.results ?? [];
    const roles: MarketSampleRole[] = results.slice(0, 5).map((r) => ({
      title: r.title ?? "Role",
      company: r.company?.display_name ?? "Company",
      url: r.redirect_url ?? "#",
      postedAt: r.created ?? new Date().toISOString(),
    }));

    const salaries = results.filter((r) => r.salary_min || r.salary_max);
    const mins = salaries.map((r) => r.salary_min).filter((n): n is number => typeof n === "number");
    const maxs = salaries.map((r) => r.salary_max).filter((n): n is number => typeof n === "number");

    return {
      roles,
      postingCount: data.count ?? results.length,
      salaryMin: mins.length ? Math.min(...mins) : undefined,
      salaryMax: maxs.length ? Math.max(...maxs) : undefined,
    };
  } catch {
    return null;
  }
}
