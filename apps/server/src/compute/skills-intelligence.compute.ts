import type { CareerJourneySkillGap, JourneyMilestone, SkillRecommendation } from "@kursa/types";

import { extractSkillsFromTaxonomy } from "../lib/resume-taxonomy.js";
import { normalizeSkillName } from "../lib/skill-normalize.js";

const META_GAP_SKILLS = new Set(["profile depth"]);

/** Normalize path skillGaps whether stored as strings or CareerPathSkillGap objects. */
export function parsePathSkillGaps(raw: unknown): CareerJourneySkillGap[] {
  if (!Array.isArray(raw)) return [];

  const gaps: CareerJourneySkillGap[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      gaps.push({
        skill: item.trim(),
        whyItMatters: "Identified on your active career path",
        priority: "medium",
      });
      continue;
    }
    if (item && typeof item === "object" && "skill" in item) {
      const skill = String((item as { skill: unknown }).skill ?? "").trim();
      if (!skill || META_GAP_SKILLS.has(skill.toLowerCase())) continue;
      gaps.push({
        skill,
        whyItMatters:
          typeof (item as { whyItMatters?: unknown }).whyItMatters === "string"
            ? (item as { whyItMatters: string }).whyItMatters
            : "Identified on your active career path",
        priority:
          (item as { priority?: CareerJourneySkillGap["priority"] }).priority ?? "medium",
      });
    }
  }
  return gaps;
}

export function extractProfileSkillsFromWorkHistory(
  workHistories: Array<{ roleTitle: string; outcomes: string }>,
): string[] {
  const corpus = workHistories
    .map((w) => `${w.roleTitle}\n${w.outcomes}`)
    .join("\n")
    .trim();
  if (!corpus) return [];

  const seen = new Set<string>();
  const names: string[] = [];
  for (const hit of extractSkillsFromTaxonomy(corpus)) {
    const key = normalizeSkillName(hit.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(normalizeSkillName(hit.name));
  }
  return names;
}

export function extractMilestoneSkills(milestones: unknown): string[] {
  if (!Array.isArray(milestones)) return [];
  const skills: string[] = [];
  const seen = new Set<string>();

  for (const raw of milestones) {
    const milestone = raw as JourneyMilestone;
    if (milestone.status === "completed") continue;
    for (const skill of milestone.requiredSkills ?? []) {
      const normalized = normalizeSkillName(skill);
      const key = normalized.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      skills.push(normalized);
    }
  }
  return skills;
}

const STALE_MS = 18 * 30 * 24 * 60 * 60 * 1000;

export function isSkillStale(lastUsedDate: Date | null | undefined): boolean {
  if (!lastUsedDate) return false;
  return lastUsedDate.getTime() < Date.now() - STALE_MS;
}

/** Extract skill tokens from job title corpus using taxonomy (not limited to profile skills). */
export function extractMarketSkillsFromTitles(
  titles: string[],
): Array<{ skill: string; frequencyPct: number }> {
  const corpus = titles.join("\n");
  const extracted = extractSkillsFromTaxonomy(corpus);
  const total = titles.length || 1;

  const counts = new Map<string, number>();
  for (const title of titles) {
    const hits = extractSkillsFromTaxonomy(title);
    for (const h of hits) {
      const key = normalizeSkillName(h.name).toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  if (counts.size === 0 && extracted.length > 0) {
    for (const e of extracted) {
      counts.set(normalizeSkillName(e.name).toLowerCase(), 1);
    }
  }

  return [...counts.entries()]
    .map(([skill, n]) => ({
      skill: normalizeSkillName(skill),
      frequencyPct: Math.round((n / total) * 100),
    }))
    .sort((a, b) => b.frequencyPct - a.frequencyPct);
}

export function mergeSkillRecommendations(
  sources: SkillRecommendation[],
  limit = 12,
): SkillRecommendation[] {
  const seen = new Map<string, SkillRecommendation>();

  for (const rec of sources.sort((a, b) => b.priority - a.priority)) {
    const key = normalizeSkillName(rec.skillName).toLowerCase();
    const existing = seen.get(key);
    if (!existing || rec.priority > existing.priority) {
      seen.set(key, rec);
    }
  }

  return [...seen.values()].slice(0, limit);
}

export function computeSkillsProfileCompleteness(skillCount: number, hasTargetRole: boolean): number {
  let score = Math.min(skillCount * 8, 60);
  if (hasTargetRole) score += 20;
  if (skillCount >= 8) score += 20;
  return Math.min(100, score);
}
