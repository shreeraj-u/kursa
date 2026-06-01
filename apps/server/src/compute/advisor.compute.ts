import type {
  AdvisorSignals,
  CareerEventSummary,
  GapSignals,
  ProfileInput,
  UserMemorySummary,
} from "@kursa/types";
import type { CareerPathDetails, Milestone } from "@kursa/types";

import { computeProfileSignals } from "./insight.compute.js";

type ActivePath = {
  title: string;
  milestones: Milestone[];
  details?: CareerPathDetails | null;
} | null;

export function computeAdvisorSignals(
  profile: ProfileInput,
  recentEvents: CareerEventSummary[],
  memories: UserMemorySummary[],
  activePath: ActivePath,
): AdvisorSignals {
  const base = computeProfileSignals(profile);
  const now = Date.now();
  const twelveWeeksAgo = now - 86400000 * 7 * 12;
  const quarterAgo = now - 86400000 * 90;

  const pulseEvents = recentEvents.filter(
    (e) =>
      e.type === "checkin_weekly" &&
      new Date(e.occurredAt).getTime() >= twelveWeeksAgo &&
      e.sentiment !== null,
  );

  const journalSentimentEvents = recentEvents.filter(
    (e) =>
      (e.type === "win" || e.type === "note") &&
      new Date(e.occurredAt).getTime() >= twelveWeeksAgo &&
      e.sentiment !== null,
  );

  const allSentiment = [...pulseEvents, ...journalSentimentEvents];

  const sentimentTrend12w =
    allSentiment.length > 0
      ? allSentiment.reduce((s, e) => s + (e.sentiment ?? 0), 0) / allSentiment.length
      : null;

  const checkInStreak = computeCheckInStreak(recentEvents);

  const winsThisQuarter = recentEvents.filter(
    (e) => e.type === "win" && new Date(e.occurredAt).getTime() >= quarterAgo,
  ).length;

  const repeatedThemes = extractRepeatedThemes(recentEvents);

  let pathMilestonesWithEvidence = 0;
  let pathMilestonesTotal = 0;
  if (activePath?.milestones) {
    pathMilestonesTotal = activePath.milestones.length;
    const milestoneOrdersWithEvidence = new Set<number>();

    for (const event of recentEvents) {
      for (const order of event.enrichment?.linkedMilestoneOrders ?? []) {
        milestoneOrdersWithEvidence.add(order);
      }
    }

    if (milestoneOrdersWithEvidence.size > 0) {
      pathMilestonesWithEvidence = milestoneOrdersWithEvidence.size;
    } else {
      pathMilestonesWithEvidence = activePath.milestones.filter(
        (m) => m.status === "completed" || m.status === "in_progress",
      ).length;
    }
  }

  const intentionActionGap = detectIntentionActionGap(profile, recentEvents);

  const recentMemoryFacts = memories
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((m) => m.fact);

  const gapSignals = computeGapSignals(activePath, profile);

  return {
    ...base,
    sentimentTrend12w,
    checkInStreak,
    winsThisQuarter,
    repeatedThemes,
    pathMilestonesWithEvidence,
    pathMilestonesTotal,
    intentionActionGap,
    recentMemoryFacts,
    gapSignals,
  };
}

function computeGapSignals(activePath: ActivePath, profile: ProfileInput): GapSignals {
  const gaps = activePath?.details?.skillGaps ?? [];
  const goalMap = new Map(
    profile.learningGoals.map((g) => [g.skillName.toLowerCase(), g.status]),
  );

  let coveredCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let missingCount = 0;
  const highPriorityMissing: string[] = [];
  let highPriorityCompletedCount = 0;

  for (const gap of gaps) {
    const needle = gap.skill.toLowerCase();
    const goalStatus = goalMap.get(needle);

    if (goalStatus === "COMPLETED") {
      completedCount++;
      if (gap.priority === "high") highPriorityCompletedCount++;
    } else if (goalStatus === "PLANNED" || goalStatus === "LEARNING") {
      inProgressCount++;
    } else {
      missingCount++;
      if (gap.priority === "high") highPriorityMissing.push(gap.skill);
    }
  }

  return {
    activePathTitle: activePath?.title ?? null,
    totalGaps: gaps.length,
    coveredCount,
    inProgressCount,
    completedCount,
    missingCount,
    highPriorityMissing,
    highPriorityCompletedCount,
  };
}

function computeCheckInStreak(events: CareerEventSummary[]): number {
  const weekly = events
    .filter((e) => e.type === "checkin_weekly")
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  let streak = 0;
  let expectedWeekStart = startOfWeek(new Date());

  for (const event of weekly) {
    const eventWeek = startOfWeek(new Date(event.occurredAt));
    if (eventWeek.getTime() === expectedWeekStart.getTime()) {
      streak++;
      expectedWeekStart = new Date(expectedWeekStart.getTime() - 7 * 86400000);
    } else if (eventWeek.getTime() < expectedWeekStart.getTime()) {
      break;
    }
  }
  return streak;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function extractRepeatedThemes(events: CareerEventSummary[]): string[] {
  const words = new Map<string, number>();
  const stop = new Set(["the", "and", "for", "with", "that", "this", "have", "from", "been", "were"]);

  for (const event of events) {
    const themeWords = event.enrichment?.themes ?? [];
    for (const theme of themeWords) {
      words.set(theme, (words.get(theme) ?? 0) + 1);
    }

    const text = `${event.body ?? ""} ${JSON.stringify(event.structured)}`.toLowerCase();
    for (const word of text.match(/\b[a-z]{4,}\b/g) ?? []) {
      if (stop.has(word)) continue;
      words.set(word, (words.get(word) ?? 0) + 1);
    }
  }

  return [...words.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function detectIntentionActionGap(
  profile: ProfileInput,
  events: CareerEventSummary[],
): boolean {
  const asp = profile.aspirations as Record<string, unknown> | null;
  if (!asp) return false;

  const targetText = [
    asp.targetRoles,
    asp.horizon3y,
    asp.horizon5y,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!targetText) return false;

  const leadershipHints = ["lead", "manager", "director", "head", "people"];
  const wantsLeadership = leadershipHints.some((h) => targetText.includes(h));
  if (!wantsLeadership) return false;

  const recentBodies = events
    .slice(0, 20)
    .map((e) => `${e.body ?? ""}`.toLowerCase())
    .join(" ");

  const themes = events.flatMap((e) => e.enrichment?.themes ?? []);
  const hasLeadershipTheme = themes.includes("leadership");
  const hasLeadershipActivity =
    hasLeadershipTheme || leadershipHints.some((h) => recentBodies.includes(h));
  return !hasLeadershipActivity;
}

export function shouldRegeneratePaths(signals: AdvisorSignals): boolean {
  if (signals.winsThisQuarter >= 3) return true;
  if (signals.sentimentTrend12w !== null && signals.sentimentTrend12w < -0.3) return true;
  if (signals.intentionActionGap) return true;
  if (signals.gapSignals.highPriorityCompletedCount > 0) return true;
  return false;
}

export function computeJournalActivityScore(events: CareerEventSummary[]): number {
  const fourWeeksAgo = Date.now() - 86400000 * 28;
  const recent = events.filter(
    (e) =>
      new Date(e.occurredAt).getTime() >= fourWeeksAgo &&
      ["win", "note", "feedback", "decision", "learning"].includes(e.type),
  );
  return Math.min(100, recent.length * 10);
}
