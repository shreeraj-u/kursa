import prisma from "@kursa/db";
import type { CareerEventType, EventEnrichment } from "@kursa/types";
import type { JourneyMilestone as Milestone } from "@kursa/types";

import { buildRuleEnrichment } from "../compute/enrichment.rules.js";
import { extractEnrichmentWithLlm } from "../lib/ai/enrichment.extract.js";
import { loadGraphContext, resolveSkillIds } from "./graph-linker.service.js";
import { mergeMemoryCandidates } from "./memory.service.js";
import { updateMilestonesFromEnrichment } from "./milestone.service.js";

export async function resolveInitialLinks(
  profileId: string,
  type: CareerEventType,
  structured: unknown,
  explicitSkillNames: string[] = [],
): Promise<{
  linkedSkillIds: string[];
  linkedPathId: string | null;
  linkedWorkHistoryId: string | null;
}> {
  const ctx = await loadGraphContext(profileId);

  let skillNames = [...explicitSkillNames];
  if (type === "win") {
    const s = structured as { skillNames?: string[] };
    skillNames = [...skillNames, ...(s.skillNames ?? [])];
  }

  const linkedSkillIds = await resolveSkillIds(profileId, skillNames);

  return {
    linkedSkillIds,
    linkedPathId: ctx.activePathId,
    linkedWorkHistoryId: ctx.workHistoryId,
  };
}

async function enrichEventAsync(
  userId: string,
  profileId: string,
  eventId: string,
): Promise<void> {
  const event = await prisma.careerEvent.findUnique({ where: { id: eventId } });
  if (!event || event.userId !== userId) return;

  const enrichableTypes: CareerEventType[] = [
    "win", "note", "feedback", "checkin_weekly", "decision", "learning", "github_activity",
  ];
  if (!enrichableTypes.includes(event.type as CareerEventType)) return;

  const ctx = await loadGraphContext(profileId);
  const text = `${event.body ?? ""} ${JSON.stringify(event.structured)}`;
  const structured = event.structured as Record<string, unknown>;
  const explicitSkills =
    event.type === "win" && Array.isArray(structured.skillNames)
      ? (structured.skillNames as string[])
      : [];

  let enrichment: EventEnrichment =
    (event.enrichment as EventEnrichment | null) ??
    buildRuleEnrichment(text, ctx.skillNames, ctx.milestones as Milestone[], explicitSkills);

  if (event.type === "note" && typeof structured.mood === "number") {
    enrichment = {
      ...enrichment,
      sentiment: (structured.mood - 3) / 2,
    };
  }

  const llmResult = await extractEnrichmentWithLlm(
    text,
    ctx.skillNames,
    ctx.milestones as Milestone[],
  );

  if (llmResult) {
    enrichment = {
      ...llmResult,
      extractedSkillNames: [
        ...new Set([...enrichment.extractedSkillNames, ...llmResult.extractedSkillNames]),
      ],
      linkedMilestoneOrders: [
        ...new Set([
          ...enrichment.linkedMilestoneOrders,
          ...llmResult.linkedMilestoneOrders,
        ]),
      ],
      memoryCandidates: [
        ...(enrichment.memoryCandidates ?? []),
        ...(llmResult.memoryCandidates ?? []),
      ],
    };
  }

  const allSkillNames = [
    ...new Set([...explicitSkills, ...enrichment.extractedSkillNames]),
  ];
  const linkedSkillIds = [
    ...new Set([
      ...event.linkedSkillIds,
      ...(await resolveSkillIds(profileId, allSkillNames)),
    ]),
  ];

  const sentiment =
    event.sentiment ??
    enrichment.sentiment ??
    (event.type === "win" || event.type === "note" ? enrichment.sentiment : null);

  await prisma.careerEvent.update({
    where: { id: eventId },
    data: {
      enrichment: enrichment as never,
      linkedSkillIds,
      linkedPathId: event.linkedPathId ?? ctx.activePathId,
      ...(sentiment != null ? { sentiment } : {}),
    },
  });

  await applyEnrichmentSideEffects(userId, eventId, ctx.activePathId, enrichment);
}

async function applyEnrichmentSideEffects(
  userId: string,
  eventId: string,
  activePathId: string | null,
  enrichment: EventEnrichment,
): Promise<void> {
  if (enrichment.memoryCandidates?.length) {
    await mergeMemoryCandidates(
      userId,
      enrichment.memoryCandidates.map((m) => ({
        category: m.category,
        fact: m.fact,
        confidence: m.confidence,
        sourceEntryIds: [eventId],
      })),
    );
  }

  if (activePathId && enrichment.linkedMilestoneOrders.length > 0) {
    await updateMilestonesFromEnrichment(userId, activePathId, enrichment);
  }
}

export async function backfillEnrichment(userId: string, profileId: string, days = 90): Promise<number> {
  const since = new Date(Date.now() - days * 86400000);
  const events = await prisma.careerEvent.findMany({
    where: {
      userId,
      deletedAt: null,
      occurredAt: { gte: since },
      type: { in: ["win", "note", "feedback", "decision", "learning"] },
    },
    take: 200,
    orderBy: { occurredAt: "desc" },
  });

  const toEnrich = events.filter((e) => e.enrichment == null).slice(0, 100);

  for (const event of toEnrich) {
    try {
      await enrichEventAsync(userId, profileId, event.id);
    } catch (err) {
      console.error("[enrichment] backfill failed for", event.id, err);
    }
  }

  return toEnrich.length;
}

export function scheduleEnrichment(
  userId: string,
  profileId: string,
  eventId: string,
): void {
  void enrichEventAsync(userId, profileId, eventId).catch((err) => {
    console.error("[enrichment] async failed for", eventId, err);
  });
}
