import prisma from "@kursa/db";
import type {
  CreateNoteInput,
  CreateWinInput,
  JournalContext,
  JournalTimelineEntry,
  RelevanceSummary,
  SentimentTrendPoint,
} from "@kursa/types";

import { assembleAdvisorContext } from "../lib/advisor-context.js";
import { eventToTag, ingestEvent, listEvents } from "./events.service.js";

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
    agent: e.source === "aria" || e.type === "aria_observation",
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
    },
  });
}

export async function createNote(userId: string, input: CreateNoteInput) {
  return ingestEvent(userId, {
    type: "note",
    source: "user",
    body: input.body,
    structured: { body: input.body },
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

export async function getSentimentTrend(userId: string): Promise<SentimentTrendPoint[]> {
  const twelveWeeksAgo = new Date(Date.now() - 86400000 * 7 * 12);
  const events = await prisma.careerEvent.findMany({
    where: {
      userId,
      type: { in: ["checkin_weekly", "checkin_monthly"] },
      occurredAt: { gte: twelveWeeksAgo },
      deletedAt: null,
    },
    orderBy: { occurredAt: "asc" },
  });

  const weekBuckets = new Map<string, number[]>();
  for (const e of events) {
    const key = getWeekStart(e.occurredAt).toISOString().slice(0, 10);
    const bucket = weekBuckets.get(key) ?? [];
    bucket.push(e.sentiment ?? 0);
    weekBuckets.set(key, bucket);
  }

  const points: SentimentTrendPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 86400000);
    const key = getWeekStart(weekDate).toISOString().slice(0, 10);
    const values = weekBuckets.get(key) ?? [];
    const value =
      values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    points.push({ weekLabel: key, value });
  }

  return points;
}

export async function getRelevance(userId: string): Promise<RelevanceSummary | null> {
  const context = await assembleAdvisorContext(userId, "observations");
  if (!context) return null;

  const { signals } = context;
  const pathAlignmentScore =
    signals.pathMilestonesTotal > 0
      ? Math.round((signals.pathMilestonesWithEvidence / signals.pathMilestonesTotal) * 100)
      : null;

  const engagementTrend = await getSentimentTrend(userId);

  return {
    pathAlignmentScore,
    staleSkills: signals.dormantHighValueSkills.slice(0, 5),
    winsThisQuarter: signals.winsThisQuarter,
    engagementTrend,
  };
}
