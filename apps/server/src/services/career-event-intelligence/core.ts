import type { CareerEventSource, CareerEventType } from "@kursa/db";
import type { CareerEventSummary, EventEnrichment, ProfileUpdateDelta } from "@kursa/types";

import { extractFromEvent } from "../../compute/event.extract.js";
import { computeProfileUpdateDelta } from "../../compute/profile-delta.js";

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

type ProfileRef = { id: string };

type CareerEventRecord = {
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
};

type InitialLinks = {
  linkedSkillIds: string[];
  linkedPathId: string | null;
  linkedWorkHistoryId: string | null;
};

export type CareerEventIntelligenceDeps = {
  resolveProfile(userId: string): Promise<ProfileRef>;
  resolveInitialLinks(
    profileId: string,
    type: CareerEventType,
    structured: unknown,
    explicitSkillNames?: string[],
  ): Promise<InitialLinks>;
  createCareerEvent(args: {
    userId: string;
    profileId: string;
    input: CreateCareerEventInput;
    links: InitialLinks;
    sentiment: number | null;
  }): Promise<CareerEventRecord>;
  applyProfileDelta(profileId: string, delta: ProfileUpdateDelta): Promise<void>;
  runMemoryDistillation(userId: string, profileId: string): Promise<void>;
  scheduleEnrichment(userId: string, profileId: string, eventId: string): void;
};

const SKIP_GRAPH_LINK_TYPES = new Set<CareerEventType>([
  "aria_observation",
  "profile_import",
  "onboarding_complete",
  "application_update",
  "system",
]);

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

function shouldResolveInitialLinks(input: CreateCareerEventInput): boolean {
  return (
    input.linkedSkillIds == null &&
    input.linkedPathId == null &&
    input.linkedWorkHistoryId == null &&
    !SKIP_GRAPH_LINK_TYPES.has(input.type) &&
    input.source === "user"
  );
}

function shouldApplyProfileDelta(input: CreateCareerEventInput): boolean {
  return !input.skipDelta;
}

function shouldScheduleUserEnrichment(input: CreateCareerEventInput): boolean {
  return !input.skipEnrich && input.source === "user";
}

function isAdvisorSignalEvent(event: { type: CareerEventType; source?: CareerEventSource }): boolean {
  return event.type !== "aria_observation";
}

export function selectAdvisorSignalEvents<T extends { type: CareerEventType; source?: CareerEventSource }>(
  events: T[],
): T[] {
  return events.filter(isAdvisorSignalEvent);
}

export function getAdvisorEventWindowStart(
  latestActivityAt: Date | null,
  now: Date = new Date(),
): Date {
  const daysSinceActivity = latestActivityAt
    ? (now.getTime() - latestActivityAt.getTime()) / 86400000
    : 999;

  const windowDays = daysSinceActivity > 14 ? 84 : 28;
  return new Date(now.getTime() - windowDays * 86400000);
}

export function toCareerEventSummary(event: CareerEventRecord): CareerEventSummary {
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

export function createCareerEventIntelligence(deps: CareerEventIntelligenceDeps) {
  return {
    async ingestEvent(userId: string, input: CreateCareerEventInput): Promise<CareerEventSummary> {
      const profile = await deps.resolveProfile(userId);
      const extracted = extractFromEvent(input.type, input.structured);

      const links = shouldResolveInitialLinks(input)
        ? await deps.resolveInitialLinks(
            profile.id,
            input.type,
            input.structured,
            explicitSkillNames(input.type, input.structured),
          )
        : {
            linkedSkillIds: input.linkedSkillIds ?? [],
            linkedPathId: input.linkedPathId ?? null,
            linkedWorkHistoryId: input.linkedWorkHistoryId ?? null,
          };

      const event = await deps.createCareerEvent({
        userId,
        profileId: profile.id,
        input,
        links,
        sentiment: extracted.sentiment,
      });

      if (shouldApplyProfileDelta(input)) {
        const delta = computeProfileUpdateDelta({
          id: event.id,
          type: event.type,
          body: event.body,
          structured: event.structured,
        });
        await deps.applyProfileDelta(profile.id, delta);
      }

      if (!input.skipDistill) {
        await deps.runMemoryDistillation(userId, profile.id);
      }

      if (shouldScheduleUserEnrichment(input)) {
        deps.scheduleEnrichment(userId, profile.id, event.id);
      }

      return toCareerEventSummary(event);
    },
  };
}

export function eventToTag(type: CareerEventType, source: CareerEventSource): string {
  if (source === "aria" || type === "aria_observation" || type === "chat_insight") return "aria";
  if (type === "win") return "win";
  if (type === "feedback") return "feedback";
  if (type.startsWith("checkin")) return "checkin";
  if (type === "decision") return "decision";
  if (type === "learning") return "learning";
  if (type === "application_update") return "application";
  return "note";
}
