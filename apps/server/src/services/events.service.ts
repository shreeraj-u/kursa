import prisma, { type CareerEventSource, type CareerEventType } from "@kursa/db";
import type { CareerEventSummary, EventEnrichment } from "@kursa/types";

import { extractFromEvent } from "../compute/event.extract.js";
import { computeProfileUpdateDelta } from "../compute/profile-delta.js";
import {
  resolveInitialLinks,
  scheduleEnrichment,
} from "./enrichment.service.js";
import { runMemoryDistillation } from "./memory.service.js";
import { applyProfileUpdateDelta } from "./profile-delta.service.js";

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
  skipEnrich?: boolean;
};

async function resolveProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found");
  return profile;
}

function explicitSkillNames(type: CareerEventType, structured: unknown): string[] {
  const s = structured as Record<string, unknown>;
  if (type === "win" && Array.isArray(s.skillNames)) {
    return (s.skillNames as string[]).filter(Boolean);
  }
  if (type === "feedback" && Array.isArray(s.linkedSkillNames)) {
    return (s.linkedSkillNames as string[]).filter(Boolean);
  }
  if (type === "learning" && typeof s.skillName === "string") {
    return [s.skillName];
  }
  return [];
}

const SKIP_GRAPH_LINK_TYPES = new Set<CareerEventType>([
  "aria_observation",
  "profile_import",
  "onboarding_complete",
  "application_update",
  "system",
]);

export async function ingestEvent(userId: string, input: CreateCareerEventInput) {
  const profile = await resolveProfile(userId);
  const extracted = extractFromEvent(input.type, input.structured);

  const links =
    input.linkedSkillIds != null ||
    input.linkedPathId != null ||
    input.linkedWorkHistoryId != null ||
    SKIP_GRAPH_LINK_TYPES.has(input.type) ||
    input.source !== "user"
      ? {
          linkedSkillIds: input.linkedSkillIds ?? [],
          linkedPathId: input.linkedPathId ?? null,
          linkedWorkHistoryId: input.linkedWorkHistoryId ?? null,
        }
      : await resolveInitialLinks(
          profile.id,
          input.type,
          input.structured,
          explicitSkillNames(input.type, input.structured),
        );

  const event = await prisma.careerEvent.create({
    data: {
      userId,
      profileId: profile.id,
      type: input.type,
      source: input.source,
      body: input.body ?? null,
      structured: input.structured as never,
      sentiment: extracted.sentiment,
      linkedSkillIds: input.linkedSkillIds ?? links.linkedSkillIds,
      linkedPathId: input.linkedPathId ?? links.linkedPathId,
      linkedWorkHistoryId: input.linkedWorkHistoryId ?? links.linkedWorkHistoryId,
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

  if (!input.skipEnrich && input.source === "user") {
    scheduleEnrichment(userId, profile.id, event.id);
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

export async function getAdvisorEventWindow(userId: string): Promise<Date> {
  const recent = await prisma.careerEvent.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { occurredAt: "desc" },
    select: { occurredAt: true },
  });

  const daysSinceActivity = recent
    ? (Date.now() - recent.occurredAt.getTime()) / 86400000
    : 999;

  const windowDays = daysSinceActivity > 14 ? 84 : 28;
  return new Date(Date.now() - windowDays * 86400000);
}

function toSummary(event: {
  id: string;
  type: CareerEventType;
  source: CareerEventSource;
  body: string | null;
  structured: unknown;
  sentiment: number | null;
  linkedSkillIds: string[];
  linkedPathId: string | null;
  linkedWorkHistoryId: string | null;
  enrichment: unknown;
  occurredAt: Date;
}): CareerEventSummary {
  return {
    id: event.id,
    type: event.type,
    source: event.source,
    body: event.body,
    structured: event.structured,
    sentiment: event.sentiment,
    linkedSkillIds: event.linkedSkillIds,
    linkedPathId: event.linkedPathId,
    linkedWorkHistoryId: event.linkedWorkHistoryId,
    enrichment: (event.enrichment as EventEnrichment | null) ?? null,
    occurredAt: event.occurredAt.toISOString(),
  };
}

export function eventToTag(type: CareerEventType, source: CareerEventSource): string {
  if (source === "aria" || type === "aria_observation") return "aria";
  if (type === "win") return "win";
  if (type === "feedback") return "feedback";
  if (type.startsWith("checkin")) return "checkin";
  if (type === "decision") return "decision";
  if (type === "learning") return "learning";
  if (type === "application_update") return "application";
  return "note";
}
