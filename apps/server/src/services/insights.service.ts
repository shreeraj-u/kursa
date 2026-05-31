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
  generationSource: "llm";
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
    });
  }
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
      const observations = persisted.map((o) => ({
        text: o.text,
        timeAgo: formatTimeAgo(o.createdAt),
        type: o.type as Observation["type"],
        source: "llm" as const,
      }));

      return paginateObservations(observations, page, limit, {
        materialChangeDetected: context.materialChangeDetected,
      });
    }
    await prisma.persistedObservation.deleteMany({ where: { profileId: profile.id } });
  }

  const sparseProfile =
    context.profile.skills.length < 2 && context.profile.workHistories.length < 1;

  const lowEventCount = context.recentEvents.length < 5;

  if (sparseProfile) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    return paginateObservations(ruleObservations, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
    });
  }

  if (lowEventCount) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    return paginateObservations(
      ruleObservations.map((o) => ({ ...o, source: "llm" as const })),
      page,
      limit,
      { materialChangeDetected: context.materialChangeDetected },
    );
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
    });
  }

  if (observations.length === 0) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    return paginateObservations(ruleObservations, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
    });
  }

  const validObservations = observations.filter((obs) => !isFallbackObservationText(obs.text));
  if (validObservations.length === 0) {
    const ruleObservations = generateRuleBasedObservations(context.signals);
    return paginateObservations(ruleObservations, page, limit, {
      materialChangeDetected: context.materialChangeDetected,
    });
  }
  observations = validObservations;

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
  meta: { materialChangeDetected: boolean },
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
    generationSource: "llm",
    materialChangeDetected: meta.materialChangeDetected,
  };
}

export async function getMaterialChangeFlag(userId: string): Promise<boolean> {
  const context = await assembleAdvisorContext(userId, "paths");
  return context?.materialChangeDetected ?? false;
}
