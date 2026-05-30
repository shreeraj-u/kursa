import prisma from "@kursa/db";

import { Errors } from "../errors/http-error.js";
import { assembleAdvisorContext, hashAdvisorContext } from "../lib/advisor-context.js";
import { classifyCareerTrajectory } from "../lib/ai/insights.classify.js";
import { generateObservations, type Observation } from "../lib/ai/insights.generate.js";
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
    for (const row of persisted) {
      if (isFallbackObservationText(row.text)) {
        throw Errors.observationsUnavailable(
          "Cached observations contain fallback template text — purge and regenerate via LLM",
          { observationId: row.id, text: row.text.slice(0, 80) },
        );
      }
    }

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

  const sparseProfile =
    context.profile.skills.length < 2 && context.profile.workHistories.length < 1;

  if (sparseProfile) {
    throw Errors.observationsUnavailable(
      "Profile is too sparse for LLM observations — complete onboarding first",
      { skills: context.profile.skills.length, workHistories: context.profile.workHistories.length },
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
    throw Errors.observationsUnavailable("OpenAI observation generation failed", {
      reason: err instanceof Error ? err.message : String(err),
    });
  }

  if (observations.length === 0) {
    throw Errors.observationsUnavailable("OpenAI returned no observations", {
      reason: "empty_response",
    });
  }

  for (const obs of observations) {
    if (isFallbackObservationText(obs.text)) {
      throw Errors.observationsUnavailable(
        "OpenAI response matched fallback template — refusing to persist",
        { text: obs.text.slice(0, 80) },
      );
    }
  }

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
