import prisma from "@kursa/db";

import { HttpError } from "../errors/http-error.js";
import { assembleAdvisorContext, hashAdvisorContext } from "../lib/advisor-context.js";
import { classifyCareerTrajectory } from "../lib/ai/insights.classify.js";
import { generateObservations, type Observation } from "../lib/ai/insights.generate.js";
import { generateRuleBasedObservations } from "../compute/observations.fallback.js";
import { ingestEvent } from "./events.service.js";

const OBSERVATION_TTL_MS = 86400000;

/** Template strings from the old rule-based path — used to detect stale/fallback data. */
const FALLBACK_PATTERNS = [
  /learning goals are past deadline:/,
  /has shown up repeatedly in your recent activity/,
  /work has slowed down\. You've built strong depth/,
  /engagement may be slipping/,
  /You haven't applied to any .* roles yet/,
] as const;

export function isFallbackObservationText(text: string): boolean {
  return FALLBACK_PATTERNS.some((pattern) => pattern.test(text));
}

export type ObservationsResult = {
  data: Observation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  generationSource: "llm" | "rules";
  materialChangeDetected: boolean;
};

export async function getObservations(
  userId: string,
  page: number,
  limit: number,
): Promise<ObservationsResult | null> {
  try {
    return await getObservationsInner(userId, page, limit);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error("[insights] getObservations failed, using fallback:", err);
    const context = await assembleAdvisorContext(userId, "observations").catch(() => null);
    const ruleObservations = context
      ? generateRuleBasedObservations(context.signals)
      : [
          {
            text: "Keep logging journal entries and check-ins — Aria learns more with each entry.",
            type: "info" as const,
            timeAgo: "noticed · today",
          },
        ];
    return paginateObservations(ruleObservations, page, limit, {
      materialChangeDetected: context?.materialChangeDetected ?? false,
      generationSource: "rules",
    });
  }
}

function hasRichContext(context: NonNullable<Awaited<ReturnType<typeof assembleAdvisorContext>>>): boolean {
  return (
    context.memories.length >= 2 ||
    context.profile.skills.length >= 3 ||
    Boolean(context.activePath) ||
    context.recentEvents.some((e) => e.type === "chat_insight" || e.type === "win")
  );
}

function supplementFromMemories(
  observations: Observation[],
  context: NonNullable<Awaited<ReturnType<typeof assembleAdvisorContext>>>,
): Observation[] {
  const seen = new Set(observations.map((o) => o.text.toLowerCase()));
  const extra: Observation[] = [];

  for (const memory of context.memories.slice(0, 3)) {
    if (extra.length >= 2) break;
    const text = memory.fact.trim();
    if (text.length < 20 || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    extra.push({
      text,
      type: "info",
      timeAgo: "noticed · from chat",
      source: "llm",
    });
  }

  for (const event of context.recentEvents) {
    if (extra.length >= 3) break;
    if (event.type !== "chat_insight" || !event.body) continue;
    const text = event.body.replace(/^Aria noted:\s*/i, "").trim();
    if (text.length < 20 || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    extra.push({
      text,
      type: "info",
      timeAgo: "noticed · from journal",
      source: "llm",
    });
  }

  return [...observations, ...extra].slice(0, 5);
}

async function getObservationsInner(
  userId: string,
  page: number,
  limit: number,
): Promise<ObservationsResult | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      updatedAt: true,
      careerTrajectory: true,
      workHistories: {
        select: {
          roleTitle: true,
          companyName: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
        },
      },
    },
  });

  if (!profile) return null;

  const context = await assembleAdvisorContext(userId, "observations");
  if (!context) return null;

  const signalsHash = hashAdvisorContext(context);

  const persisted = await prisma.persistedObservation.findMany({
    where: {
      profileId: profile.id,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const freshEnough =
    persisted.length > 0 &&
    persisted[0]!.signalsHash === signalsHash &&
    persisted[0]!.createdAt.getTime() > Date.now() - OBSERVATION_TTL_MS;

  if (freshEnough) {
    let hasStaleFallback = false;
    for (const row of persisted) {
      if (isFallbackObservationText(row.text)) {
        hasStaleFallback = true;
        break;
      }
    }
    if (!hasStaleFallback) {
      let observations = persisted.map((o) => ({
        text: o.text,
        timeAgo: formatTimeAgo(o.createdAt),
        type: o.type as Observation["type"],
        source: "llm" as const,
      }));

      if (observations.length < 4) {
        observations = supplementFromMemories(observations, context);
      }

      return paginateObservations(observations, page, limit, {
        materialChangeDetected: context.materialChangeDetected,
        generationSource: "llm",
      });
    }
    await prisma.persistedObservation.deleteMany({ where: { profileId: profile.id } });
  }

  const sparseProfile =
    context.profile.skills.length < 2 &&
    context.profile.workHistories.length < 1 &&
    context.memories.length === 0;

  if (sparseProfile) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    return paginateObservations(ruleObservations, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
      generationSource: "rules",
    });
  }

  const lowEventCount = context.recentEvents.length < 3 && !hasRichContext(context);
  if (lowEventCount) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    const supplemented = supplementFromMemories(ruleObservations, context);
    return paginateObservations(supplemented, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
      generationSource: supplemented.length > ruleObservations.length ? "llm" : "rules",
    });
  }

  if (!profile.careerTrajectory && profile.workHistories.length > 0) {
    const trajectory = await classifyCareerTrajectory(profile.workHistories);
    await prisma.profile.update({
      where: { id: profile.id },
      data: { careerTrajectory: trajectory },
    });
    context.profile.careerTrajectory = trajectory;
  }

  let observations: Observation[];

  try {
    observations = await generateObservations(context);
  } catch (err) {
    console.warn("[insights] LLM observation generation failed, using rules:", err);
    const ruleObservations = generateRuleBasedObservations(context.signals);
    return paginateObservations(ruleObservations, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
      generationSource: "rules",
    });
  }

  if (observations.length === 0) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    const supplemented = supplementFromMemories(ruleObservations, context);
    return paginateObservations(supplemented, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
      generationSource: supplemented.length > ruleObservations.length ? "llm" : "rules",
    });
  }

  const validObservations = observations.filter((obs) => !isFallbackObservationText(obs.text));
  if (validObservations.length === 0) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    const supplemented = supplementFromMemories(ruleObservations, context);
    return paginateObservations(supplemented, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
      generationSource: supplemented.length > ruleObservations.length ? "llm" : "rules",
    });
  }
  observations = supplementFromMemories(validObservations, context);

  await prisma.persistedObservation.deleteMany({ where: { profileId: profile.id } });

  const expiresAt = new Date(Date.now() + OBSERVATION_TTL_MS);
  const sourceEntryIds = context.recentEvents.slice(0, 5).map((e) => e.id);

  for (const obs of observations) {
    await prisma.persistedObservation.create({
      data: {
        userId,
        profileId: profile.id,
        text: obs.text,
        type: obs.type,
        signalsHash,
        sourceEntryIds,
        expiresAt,
      },
    });

    await ingestEvent(userId, {
      type: "aria_observation",
      source: "aria",
      body: obs.text,
      structured: { text: obs.text, observationType: obs.type, generationSource: "llm" },
      skipDelta: true,
      skipDistill: true,
      skipEnrich: true,
    });
  }

  const enriched = observations.map((o) => ({ ...o, source: "llm" as const }));

  return paginateObservations(enriched, page, limit, {
    materialChangeDetected: context.materialChangeDetected,
    generationSource: "llm",
  });
}

function formatTimeAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days === 0) return "noticed · today";
  if (days === 1) return "noticed · yesterday";
  return `noticed · ${days}d ago`;
}

function paginateObservations(
  observations: Observation[],
  page: number,
  limit: number,
  meta: { materialChangeDetected: boolean; generationSource?: "llm" | "rules" },
): ObservationsResult {
  const total = observations.length;
  const paginated = observations.slice((page - 1) * limit, page * limit);

  return {
    data: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    generationSource: meta.generationSource ?? "llm",
    materialChangeDetected: meta.materialChangeDetected,
  };
}

export async function getMaterialChangeFlag(userId: string): Promise<boolean> {
  const context = await assembleAdvisorContext(userId, "paths");
  return context?.materialChangeDetected ?? false;
}
