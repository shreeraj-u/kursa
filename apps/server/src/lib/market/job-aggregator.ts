import type { MarketSampleRole } from "@kursa/types";

export interface JobSearchResult {
  roles: MarketSampleRole[];
  postingCount: number;
  salaryMin?: number;
  salaryMax?: number;
  source: string;
}

export function mergeJobResults(
  results: Array<JobSearchResult | null>,
  maxRoles = 8,
): { roles: MarketSampleRole[]; postingCount: number; salaryMin?: number; salaryMax?: number; sources: string[] } {
  const sources: string[] = [];
  const seen = new Set<string>();
  const roles: MarketSampleRole[] = [];
  let postingCount = 0;
  const mins: number[] = [];
  const maxs: number[] = [];

  for (const r of results) {
    if (!r || r.roles.length === 0) continue;
    sources.push(r.source);
    postingCount += r.postingCount;
    if (r.salaryMin != null) mins.push(r.salaryMin);
    if (r.salaryMax != null) maxs.push(r.salaryMax);

    for (const role of r.roles) {
      const key = `${role.title.toLowerCase()}|${role.company.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      roles.push(role);
      if (roles.length >= maxRoles) break;
    }
    if (roles.length >= maxRoles) break;
  }

  return {
    roles,
    postingCount,
    salaryMin: mins.length ? Math.min(...mins) : undefined,
    salaryMax: maxs.length ? Math.max(...maxs) : undefined,
    sources,
  };
}

/** Derive search tags from a role title for Remote OK / keyword filters. */
export function keywordsFromRoleTitle(title: string): string[] {
  const t = title.toLowerCase();
  const tags: string[] = [];
  if (/\b(engineer|developer|dev)\b/.test(t)) tags.push("engineer", "dev");
  if (/\b(product)\b/.test(t)) tags.push("product");
  if (/\b(design)\b/.test(t)) tags.push("design");
  if (/\b(data|ml|ai|machine learning)\b/.test(t)) tags.push("data", "python");
  if (/\b(manager|lead|director)\b/.test(t)) tags.push("manager");
  if (tags.length === 0) {
    const words = t.split(/\s+/).filter((w) => w.length > 3);
    tags.push(...words.slice(0, 2));
  }
  return [...new Set(tags)].slice(0, 4);
}

export function matchesKeyword(text: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 3) return true;
  const hay = text.toLowerCase();
  const tokens = q.split(/\s+/).filter((w) => w.length > 2);
  if (tokens.length === 0) return hay.includes(q);
  return tokens.some((tok) => hay.includes(tok));
}
