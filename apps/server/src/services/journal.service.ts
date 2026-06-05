import prisma from "@kursa/db";
import type {
  CreateDecisionInput,
  CreateFeedbackInput,
  CreateLearningInput,
  CreateNoteInput,
  CreateWinInput,
  JournalContext,
  JournalTimelineEntry,
  RelevanceSummary,
  SentimentTrendPoint,
} from "@kursa/types";

import {
  extractLearningGoalFromText,
  fallbackLearningGoalExtraction,
} from "../lib/ai/journal-learn.extract.js";
import { assembleAdvisorContext } from "../lib/advisor-context.js";
import { computeJournalActivityScore } from "../compute/advisor.compute.js";
import { eventToTag, ingestEvent, listEvents } from "./events.service.js";
import { getMilestoneEvidenceForUser } from "./milestone.service.js";

export async function getTimeline(
  userId: string,
  page: number,
  limit: number,
  filter?: "win" | "all",
) {
  const { data, total } = await listEvents(userId, {
    page,
    limit,
    type: filter === "win" ? "win" : undefined,
  });

  const entries: JournalTimelineEntry[] = data.map((e) => ({
    ...e,
    tag: eventToTag(e.type, e.source),
    agent: e.source === "aria" || e.type === "aria_observation" || e.type === "chat_insight",
  }));

  return {
    data: entries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createWin(userId: string, input: CreateWinInput) {
  return ingestEvent(userId, {
    type: "win",
    source: "user",
    body: input.body,
    structured: {
      title: input.title,
      body: input.body,
      skillNames: input.skillNames ?? [],
      impactMetric: input.impactMetric,
      collaborators: input.collaborators,
      linkedMilestoneOrder: input.linkedMilestoneOrder,
    },
  });
}

export async function createNote(userId: string, input: CreateNoteInput) {
  return ingestEvent(userId, {
    type: "note",
    source: "user",
    body: input.body,
    structured: {
      body: input.body,
      mood: input.mood,
      tags: input.tags,
    },
    skipDelta: true,
  });
}

export async function createFeedback(userId: string, input: CreateFeedbackInput) {
  return ingestEvent(userId, {
    type: "feedback",
    source: "user",
    body: input.body,
    structured: {
      body: input.body,
      fromRole: input.fromRole,
      receivedAt: input.receivedAt,
      linkedSkillNames: input.linkedSkillNames,
    },
  });
}

export async function createDecision(userId: string, input: CreateDecisionInput) {
  return ingestEvent(userId, {
    type: "decision",
    source: "user",
    body: input.reasoning,
    structured: {
      title: input.title,
      optionsConsidered: input.optionsConsidered,
      choiceMade: input.choiceMade,
      reasoning: input.reasoning,
    },
  });
}

export async function createLearning(userId: string, input: CreateLearningInput) {
  const rawText = input.skillName.trim();
  const extracted =
    (await extractLearningGoalFromText(rawText)) ?? fallbackLearningGoalExtraction(rawText);

  return ingestEvent(userId, {
    type: "learning",
    source: "user",
    body: extracted.summary,
    structured: {
      skillName: extracted.skillName,
      originalText: rawText !== extracted.skillName ? rawText : undefined,
      resourceType: input.resourceType,
      hours: input.hours,
      completed: input.completed,
    },
  });
}

export async function createApplicationUpdate(
  userId: string,
  input: {
    applicationId: string;
    company: string;
    roleTitle: string;
    previousStage?: string;
    newStage: string;
  },
) {
  return ingestEvent(userId, {
    type: "application_update",
    source: "system",
    body: `${input.company} · ${input.roleTitle}: ${input.previousStage ?? "unknown"} → ${input.newStage}`,
    structured: input,
    skipDelta: true,
  });
}

export async function getJournalContext(userId: string): Promise<JournalContext | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      targetRole: true,
      workHistories: {
        where: { isCurrent: true },
        take: 1,
        select: { companyName: true, roleTitle: true, startDate: true },
      },
    },
  });

  if (!profile) return null;

  const current = profile.workHistories[0];
  const tenureDays = current
    ? Math.floor((Date.now() - current.startDate.getTime()) / 86400000)
    : null;

  const statusLabel = current ? "employed" : profile.targetRole ? "active" : "exploring";

  return {
    statusLabel,
    company: current?.companyName ?? null,
    roleTitle: current?.roleTitle ?? profile.targetRole,
    tenureDays,
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export async function getCompositeEngagementTrend(userId: string): Promise<SentimentTrendPoint[]> {
  const twelveWeeksAgo = new Date(Date.now() - 86400000 * 7 * 12);
  const events = await prisma.careerEvent.findMany({
    where: {
      userId,
      deletedAt: null,
      occurredAt: { gte: twelveWeeksAgo },
    },
    orderBy: { occurredAt: "asc" },
  });

  const weekBuckets = new Map<string, { sentiments: number[]; activity: number }>();

  for (const e of events) {
    const key = getWeekStart(e.occurredAt).toISOString().slice(0, 10);
    const bucket = weekBuckets.get(key) ?? { sentiments: [], activity: 0 };

    if (e.type === "checkin_weekly" || e.type === "checkin_monthly") {
      if (e.sentiment != null) bucket.sentiments.push(e.sentiment);
    }
    if (["win", "note", "feedback"].includes(e.type)) {
      bucket.activity += 1;
      if (e.sentiment != null) bucket.sentiments.push(e.sentiment);
    }

    weekBuckets.set(key, bucket);
  }

  const points: SentimentTrendPoint[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 86400000);
    const key = getWeekStart(weekDate).toISOString().slice(0, 10);
    const bucket = weekBuckets.get(key) ?? { sentiments: [], activity: 0 };

    const avgSentiment =
      bucket.sentiments.length > 0
        ? bucket.sentiments.reduce((s, v) => s + v, 0) / bucket.sentiments.length
        : 0;

    const activityBoost = Math.min(0.3, bucket.activity * 0.05);
    const normalized = Math.max(0, Math.min(1, (avgSentiment + 1) / 2 + activityBoost));

    points.push({
      weekLabel: key,
      value: normalized,
      summary:
        bucket.activity > 0
          ? `${bucket.activity} journal entries`
          : bucket.sentiments.length > 0
            ? "check-in recorded"
            : undefined,
    });
  }

  return points;
}

/** @deprecated Use getCompositeEngagementTrend — kept for backward compatibility */
export async function getSentimentTrend(userId: string): Promise<SentimentTrendPoint[]> {
  return getCompositeEngagementTrend(userId);
}

export async function getRelevance(userId: string): Promise<RelevanceSummary | null> {
  try {
    const context = await assembleAdvisorContext(userId, "journal");
    if (!context) return null;

    const { signals } = context;
    const pathAlignmentScore =
      signals.pathMilestonesTotal > 0
        ? Math.round((signals.pathMilestonesWithEvidence / signals.pathMilestonesTotal) * 100)
        : null;

    const engagementTrend = await getCompositeEngagementTrend(userId);
    const milestoneEvidence = await getMilestoneEvidenceForUser(userId);

    const memories = context.memories.slice(0, 3).map((m) => ({
      id: m.id,
      category: m.category,
      fact: m.fact,
      confidence: m.confidence,
      validFrom: m.validFrom,
    }));

    return {
      pathAlignmentScore,
      staleSkills: signals.dormantHighValueSkills.slice(0, 5),
      winsThisQuarter: signals.winsThisQuarter,
      engagementTrend,
      intentionActionGap: signals.intentionActionGap,
      recentMemoryFacts: signals.recentMemoryFacts,
      materialChangeDetected: context.materialChangeDetected,
      activePathTitle: context.activePath?.title ?? null,
      memories,
      milestoneEvidence,
      checkInStreak: signals.checkInStreak,
      journalActivityScore: computeJournalActivityScore(context.recentEvents),
    };
  } catch (err) {
    console.error("[journal] getRelevance failed:", err);
    return null;
  }
}

export async function getUserSkillsForJournal(userId: string): Promise<string[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { skills: { select: { name: true }, orderBy: { name: "asc" } } },
  });
  return profile?.skills.map((s) => s.name) ?? [];
}
