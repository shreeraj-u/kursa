import prisma, { type CareerEventSource, type CareerEventType } from "@kursa/db";
import type { CareerEventSummary } from "@kursa/types";

import { extractFromEvent } from "../compute/event.extract.js";
import { computeProfileUpdateDelta } from "../compute/profile-delta.js";
import { applyProfileUpdateDelta } from "./profile-delta.service.js";
import { runMemoryDistillation } from "./memory.service.js";

export type CreateCareerEventInput = {
  type: CareerEventType;
  source: CareerEventSource;
  body?: string | null;
  structured: unknown;
  occurredAt?: Date;
  linkedSkillIds?: string[];
  linkedPathId?: string | null;
  linkedWorkHistoryId?: string | null;
  skipDelta?: boolean;
  skipDistill?: boolean;
};

async function resolveProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found");
  return profile;
}

export async function ingestEvent(userId: string, input: CreateCareerEventInput) {
  const profile = await resolveProfile(userId);
  const extracted = extractFromEvent(input.type, input.structured);

  const event = await prisma.careerEvent.create({
    data: {
      userId,
      profileId: profile.id,
      type: input.type,
      source: input.source,
      body: input.body ?? null,
      structured: input.structured as never,
      sentiment: extracted.sentiment,
      linkedSkillIds: input.linkedSkillIds ?? extracted.linkedSkillIds,
      linkedPathId: input.linkedPathId ?? null,
      linkedWorkHistoryId: input.linkedWorkHistoryId ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });

  if (!input.skipDelta) {
    const delta = computeProfileUpdateDelta({
      id: event.id,
      type: event.type,
      body: event.body,
      structured: event.structured,
    });
    await applyProfileUpdateDelta(profile.id, delta);
  }

  if (!input.skipDistill) {
    await runMemoryDistillation(userId, profile.id);
  }

  return toSummary(event);
}

export async function listEvents(
  userId: string,
  opts: { page?: number; limit?: number; type?: CareerEventType } = {},
): Promise<{ data: CareerEventSummary[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 30;
  const where = {
    userId,
    deletedAt: null,
    ...(opts.type ? { type: opts.type } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.careerEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.careerEvent.count({ where }),
  ]);

  return { data: rows.map(toSummary), total };
}

export async function getRecentEvents(userId: string, since: Date, limit = 50) {
  const rows = await prisma.careerEvent.findMany({
    where: { userId, deletedAt: null, occurredAt: { gte: since } },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  return rows.map(toSummary);
}

function toSummary(event: {
  id: string;
  type: CareerEventType;
  source: CareerEventSource;
  body: string | null;
  structured: unknown;
  sentiment: number | null;
  occurredAt: Date;
}): CareerEventSummary {
  return {
    id: event.id,
    type: event.type,
    source: event.source,
    body: event.body,
    structured: event.structured,
    sentiment: event.sentiment,
    occurredAt: event.occurredAt.toISOString(),
  };
}

export function eventToTag(type: CareerEventType, source: CareerEventSource): string {
  if (source === "aria" || type === "aria_observation") return "aria";
  if (type === "win") return "win";
  if (type === "feedback") return "feedback";
  if (type.startsWith("checkin")) return "checkin";
  return "note";
}
