import type { EventEnrichment, MemoryCategory } from "@kursa/types";
import type { JourneyMilestone as Milestone } from "@kursa/types";

const THEME_KEYWORDS: Record<string, string[]> = {
  leadership: ["lead", "team", "manage", "mentor", "direct", "people"],
  technical: ["code", "engineer", "architect", "deploy", "api", "system", "build"],
  stakeholder: ["stakeholder", "executive", "present", "align", "cross-functional"],
  delivery: ["ship", "launch", "deliver", "release", "milestone", "deadline"],
};

export function extractThemes(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(THEME_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => lower.includes(k)))
    .map(([theme]) => theme);
}

export function extractEntities(text: string): string[] {
  const entities = new Set<string>();
  for (const match of text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) ?? []) {
    if (match.length > 2 && match.length < 40) entities.add(match);
  }
  return [...entities].slice(0, 10);
}

export function matchMilestonesByKeywords(
  text: string,
  milestones: Milestone[],
): number[] {
  const lower = text.toLowerCase();
  const matched: number[] = [];

  for (const milestone of milestones) {
    const terms = [
      milestone.title,
      milestone.description,
      ...milestone.requiredSkills,
    ]
      .join(" ")
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g) ?? [];

    const uniqueTerms = [...new Set(terms)].filter(
      (t) => !["with", "this", "that", "from", "your", "will", "have"].includes(t),
    );

    const hits = uniqueTerms.filter((term) => lower.includes(term)).length;
    if (hits >= 2 || (hits >= 1 && uniqueTerms.length <= 3)) {
      matched.push(milestone.order);
    }
  }

  return matched;
}

export function estimateSentiment(text: string): number {
  const lower = text.toLowerCase();
  const positive = ["great", "success", "achieved", "improved", "delivered", "won", "happy", "excited"];
  const negative = ["blocked", "failed", "struggle", "difficult", "frustrated", "missed", "delay"];

  let score = 0;
  for (const word of positive) if (lower.includes(word)) score += 0.15;
  for (const word of negative) if (lower.includes(word)) score -= 0.15;
  return Math.max(-1, Math.min(1, score));
}

export function extractSkillNamesFromText(text: string, profileSkills: string[]): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const skill of profileSkills) {
    if (lower.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }

  return found;
}

export function buildRuleEnrichment(
  text: string,
  profileSkills: string[],
  milestones: Milestone[],
  explicitSkillNames: string[] = [],
): EventEnrichment {
  const extracted = extractSkillNamesFromText(text, profileSkills);
  const skillNames = [...new Set([...explicitSkillNames, ...extracted])];
  const themes = extractThemes(text);
  const entities = extractEntities(text);
  const linkedMilestoneOrders = matchMilestonesByKeywords(text, milestones);
  const sentiment = estimateSentiment(text);

  const memoryCandidates: EventEnrichment["memoryCandidates"] = [];
  if (skillNames.length > 0 && text.length > 30) {
    memoryCandidates.push({
      category: "skill_evidence" as MemoryCategory,
      fact: `Recent activity involved ${skillNames.slice(0, 3).join(", ")}.`,
      confidence: 0.7,
    });
  }
  if (themes.includes("leadership") && text.length > 40) {
    memoryCandidates.push({
      category: "achievement_theme" as MemoryCategory,
      fact: "Recent activity shows leadership or people-focused work.",
      confidence: 0.65,
    });
  }

  return {
    method: "rules",
    themes,
    entities,
    linkedMilestoneOrders,
    extractedSkillNames: skillNames,
    sentiment: sentiment !== 0 ? sentiment : undefined,
    memoryCandidates,
  };
}

export function countEvidencePerMilestone(
  events: Array<{ id: string; enrichment: EventEnrichment | null; occurredAt: string }>,
  milestones: Milestone[],
): Array<{ order: number; title: string; status: Milestone["status"]; eventCount: number; recentEventIds: string[] }> {
  return milestones.map((m) => {
    const linked = events.filter((e) =>
      e.enrichment?.linkedMilestoneOrders?.includes(m.order),
    );
    return {
      order: m.order,
      title: m.title,
      status: m.status,
      eventCount: linked.length,
      recentEventIds: linked.slice(0, 5).map((e) => e.id),
    };
  });
}
