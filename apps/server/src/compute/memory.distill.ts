import type { MemoryCandidate } from "@kursa/types";
import type { CareerEventType } from "@kursa/types";

export type EventForDistill = {
  id: string;
  type: CareerEventType;
  body: string | null;
  structured: unknown;
  sentiment: number | null;
  occurredAt: Date;
};

export type ExistingMemory = {
  id: string;
  category: string;
  fact: string;
  confidence: number;
};

export function distillMemories(
  recentEvents: EventForDistill[],
  existingMemories: ExistingMemory[],
  aspirations: unknown | null,
): MemoryCandidate[] {
  const candidates: MemoryCandidate[] = [];
  const sixWeeksAgo = Date.now() - 86400000 * 42;

  const recent = recentEvents.filter((e) => e.occurredAt.getTime() >= sixWeeksAgo);

  const lowChallenge = recent.filter((e) => {
    if (e.type !== "checkin_weekly") return false;
    const s = e.structured as { challengeLevel?: number };
    return typeof s.challengeLevel === "number" && s.challengeLevel <= 2;
  });

  if (lowChallenge.length >= 3) {
    candidates.push({
      category: "sentiment",
      fact: "You have reported low challenge levels in multiple recent weekly check-ins.",
      confidence: Math.min(0.95, 0.5 + lowChallenge.length * 0.1),
      sourceEntryIds: lowChallenge.map((e) => e.id),
    });
  }

  const rememberEvents = recent.filter((e) => e.type === "checkin_weekly");
  for (const event of rememberEvents) {
    const s = event.structured as { rememberThis?: string };
    const text = s.rememberThis?.trim();
    if (text && text.length > 10) {
      candidates.push({
        category: "skill",
        fact: `You asked to remember: ${text.slice(0, 200)}`,
        confidence: 0.85,
        sourceEntryIds: [event.id],
      });
    }
  }

  const wordCounts = new Map<string, number>();
  for (const event of recent) {
    const text = `${event.body ?? ""}`.toLowerCase();
    for (const word of text.match(/\b[a-z]{5,}\b/g) ?? []) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }

  for (const [word, count] of wordCounts) {
    if (count >= 3) {
      const related = recent.filter((e) =>
        `${e.body ?? ""}`.toLowerCase().includes(word),
      );
      candidates.push({
        category: "pattern",
        fact: `The theme "${word}" has come up repeatedly in your recent career activity.`,
        confidence: Math.min(0.9, 0.4 + count * 0.1),
        sourceEntryIds: related.map((e) => e.id),
      });
    }
  }

  const asp = aspirations as Record<string, unknown> | null;
  if (asp) {
    const targetText = [asp.targetRoles, asp.horizon3y].filter(Boolean).join(" ").toLowerCase();
    const recentText = recent.map((e) => `${e.body ?? ""}`).join(" ").toLowerCase();
    if (targetText.includes("lead") && !recentText.includes("lead") && !recentText.includes("team")) {
      candidates.push({
        category: "contradiction",
        fact: "Your stated goals mention leadership growth, but recent activity has not reflected people leadership.",
        confidence: 0.75,
        sourceEntryIds: recent.slice(0, 5).map((e) => e.id),
      });
    }
  }

  void existingMemories;
  return dedupeCandidates(candidates);
}

function dedupeCandidates(candidates: MemoryCandidate[]): MemoryCandidate[] {
  const seen = new Set<string>();
  const out: MemoryCandidate[] = [];
  for (const c of candidates) {
    const key = `${c.category}:${c.fact.slice(0, 80)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
