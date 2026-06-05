import { extractSkillsFromTaxonomy } from "./resume-taxonomy.js";

/** Canonical display name for skill matching (case-insensitive dedupe). */
export function normalizeSkillName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  const fromTaxonomy = extractSkillsFromTaxonomy(trimmed);
  if (fromTaxonomy.length > 0) {
    return fromTaxonomy[0]!.name;
  }

  return trimmed
    .split(/\s+/)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

export function skillNamesMatch(a: string, b: string): boolean {
  return normalizeSkillName(a).toLowerCase() === normalizeSkillName(b).toLowerCase();
}
