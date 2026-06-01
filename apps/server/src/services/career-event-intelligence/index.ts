import prisma from "@kursa/db";
import type { CareerEventType } from "@kursa/db";
import type { CareerEventSummary } from "@kursa/types";

import {
  createCareerEventIntelligence,
  eventToTag,
  getAdvisorEventWindowStart,
  toCareerEventSummary,
  type CreateCareerEventInput,
} from "./core.js";
import { resolveInitialLinks, scheduleEnrichment } from "../enrichment.service.js";
import { runMemoryDistillation } from "../memory.service.js";
import { applyProfileUpdateDelta } from "../profile-delta.service.js";

async function resolveProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found");
  return profile;
}

const careerEventIntelligence = createCareerEventIntelligence({
  resolveProfile,
  resolveInitialLinks,
  async createCareerEvent({ userId, profileId, input, links, sentiment }) {
    return prisma.careerEvent.create({
      data: {
        userId,
        profileId,
        type: input.type,
        source: input.source,
        body: input.body ?? null,
        structured: input.structured as never,
        sentiment,
        linkedSkillIds: input.linkedSkillIds ?? links.linkedSkillIds,
        linkedPathId: input.linkedPathId ?? links.linkedPathId,
        linkedWorkHistoryId: input.linkedWorkHistoryId ?? links.linkedWorkHistoryId,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  },
  applyProfileDelta: applyProfileUpdateDelta,
  runMemoryDistillation,
  scheduleEnrichment,
});

export async function ingestEvent(userId: string, input: CreateCareerEventInput) {
  return careerEventIntelligence.ingestEvent(userId, input);
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

  return { data: rows.map(toCareerEventSummary), total };
}

export async function getRecentEvents(userId: string, since: Date, limit = 50) {
  const rows = await prisma.careerEvent.findMany({
    where: { userId, deletedAt: null, occurredAt: { gte: since } },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  return rows.map(toCareerEventSummary);
}

export async function getAdvisorEventWindow(userId: string): Promise<Date> {
  const recent = await prisma.careerEvent.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { occurredAt: "desc" },
    select: { occurredAt: true },
  });

  return getAdvisorEventWindowStart(recent?.occurredAt ?? null);
}

export { eventToTag };
export type { CreateCareerEventInput };
export {
  createCareerEventIntelligence,
  explicitSkillNames,
  getAdvisorEventWindowStart,
  isAdvisorSignalEvent,
  selectAdvisorSignalEvents,
  shouldApplyProfileDelta,
  shouldResolveInitialLinks,
  shouldScheduleUserEnrichment,
} from "./core.js";
