import prisma, { Prisma } from "@kursa/db";
import type {
  CareerJourney,
  CareerJourneyDetails,
  JourneyMilestone,
  JourneyRevisionBrief,
  JourneyRevisionPreview,
  JourneyRevisionStartRequest,
  JourneyRevisionStartResponse,
  JourneyReviseResponse,
} from "@kursa/types";

import { extractRevisionBrief, reviseCareerJourney } from "../lib/ai/journey.generate.js";
import { ingestEvent } from "./career-event-intelligence/index.js";
import * as journeyService from "./journey.service.js";

const REVISION_STARTER_CHIPS = [
  "Timeline is too aggressive",
  "Wrong target role / direction",
  "A milestone doesn't match my situation",
  "Skill gaps feel off",
  "I want more stability / less risk",
  "Missing something from my profile",
];

const INITIAL_REVISION_MESSAGE =
  "What feels off about this path? You can mention the overall direction, timeline, a specific milestone, or skill gaps. I'll suggest changes before we apply anything.";

async function loadActiveJourney(userId: string): Promise<{ profileId: string; journey: CareerJourney } | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      careerPaths: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!profile?.careerPaths[0]) return null;

  const row = profile.careerPaths[0];
  return {
    profileId: profile.id,
    journey: {
      id: row.id,
      profileId: row.profileId,
      title: row.title,
      description: row.description,
      confidenceScore: row.confidenceScore,
      projectedTimelineMonths: row.projectedTimelineMonths,
      details: row.details as CareerJourney["details"],
      milestones: (row.milestones as unknown as JourneyMilestone[]) ?? [],
    },
  };
}

export async function startRevision(
  userId: string,
  input: JourneyRevisionStartRequest = {},
): Promise<JourneyRevisionStartResponse | null> {
  const loaded = await loadActiveJourney(userId);
  if (!loaded) return null;

  const existing = await prisma.conversation.findFirst({
    where: {
      userId,
      decisionType: "journey_revision",
      careerPathId: loaded.journey.id,
    },
    orderBy: { updatedAt: "desc" },
  });

  let conversationId: string;
  if (existing) {
    conversationId = existing.id;
  } else {
    const conv = await prisma.conversation.create({
      data: {
        userId,
        decisionType: "journey_revision",
        careerPathId: loaded.journey.id,
      },
    });
    conversationId = conv.id;

    const prefill = buildPrefillMessage(input);
    await prisma.chatMessage.create({
      data: { conversationId, role: "assistant", content: prefill },
    });
  }

  return {
    conversationId,
    journey: loaded.journey,
    initialMessage: INITIAL_REVISION_MESSAGE,
    starterChips: REVISION_STARTER_CHIPS,
  };
}

function buildPrefillMessage(input: JourneyRevisionStartRequest): string {
  const parts = [INITIAL_REVISION_MESSAGE];
  if (input.focusMilestoneOrder != null) {
    parts.push(`(You flagged milestone ${input.focusMilestoneOrder} as feeling off.)`);
  }
  if (input.themes?.length) {
    parts.push(`Themes: ${input.themes.join(", ")}.`);
  }
  return parts.join(" ");
}

export async function buildRevisionBrief(
  userId: string,
  conversationId: string,
): Promise<JourneyRevisionBrief | null> {
  const loaded = await loadActiveJourney(userId);
  if (!loaded) return null;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, decisionType: "journey_revision" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return null;

  return extractRevisionBrief(
    conversation.messages.map((m) => ({ role: m.role, content: m.content })),
    loaded.journey,
  );
}

export function buildRevisionPreview(
  journey: CareerJourney,
  brief: JourneyRevisionBrief,
  userFeedbackSummary: string,
): JourneyRevisionPreview {
  const changes: JourneyRevisionPreview["changes"] = [];
  const affectedOrders = new Set(brief.milestonePatches?.map((p) => p.order) ?? []);

  if (brief.journeyPatches?.title) {
    changes.push({
      target: "Journey title",
      before: journey.title,
      after: brief.journeyPatches.title,
    });
  }
  if (brief.journeyPatches?.description) {
    changes.push({
      target: "Journey description",
      before: journey.description.slice(0, 120),
      after: brief.journeyPatches.description.slice(0, 120),
    });
  }

  for (const patch of brief.milestonePatches ?? []) {
    const milestone = journey.milestones.find((m) => m.order === patch.order);
    if (!milestone) continue;
    const afterTitle = patch.replacement?.title ?? patch.patch?.title ?? milestone.title;
    if (afterTitle !== milestone.title || patch.action !== "update") {
      changes.push({
        target: `Milestone ${patch.order}`,
        before: milestone.title,
        after: `${patch.action}: ${afterTitle}`,
      });
    }
  }

  const preservedMilestones = journey.milestones
    .filter((m) => {
      if (brief.preserveCompleted && m.status === "completed") return true;
      if (brief.preserveManuallySet && m.manuallySet) return true;
      return !affectedOrders.has(m.order);
    })
    .map((m) => m.order);

  return {
    summary: brief.summary,
    userFeedbackSummary,
    changes,
    preservedMilestones,
    willRebuildEntirePath: brief.changeScope === "full_rebuild",
  };
}

function shouldSkipMilestone(
  milestone: JourneyMilestone,
  brief: JourneyRevisionBrief,
): boolean {
  if (brief.preserveCompleted && milestone.status === "completed") return true;
  if (brief.preserveManuallySet && milestone.manuallySet) return true;
  return false;
}

function applyMilestonePatches(
  milestones: JourneyMilestone[],
  brief: JourneyRevisionBrief,
): { milestones: JourneyMilestone[]; changedOrders: number[] } {
  let result = [...milestones];
  const changedOrders: number[] = [];

  for (const patch of brief.milestonePatches ?? []) {
    const index = result.findIndex((m) => m.order === patch.order);
    if (index === -1 && patch.action !== "insert_after") continue;

    const current = result[index];
    if (current && shouldSkipMilestone(current, brief)) continue;

    changedOrders.push(patch.order);

    if (patch.action === "remove" && index !== -1) {
      result.splice(index, 1);
      continue;
    }

    if (patch.action === "replace" && index !== -1 && current && patch.replacement) {
      result[index] = {
        ...current,
        ...patch.replacement,
        order: current.order,
        title: patch.replacement.title ?? current.title,
        description: patch.replacement.description ?? current.description,
        status: current.status,
        manuallySet: current.manuallySet,
        estimatedMonthsFromNow:
          patch.replacement.estimatedMonthsFromNow ?? current.estimatedMonthsFromNow,
        salaryBand: patch.replacement.salaryBand ?? current.salaryBand,
        requiredSkills: patch.replacement.requiredSkills ?? current.requiredSkills,
      };
      continue;
    }

    if (patch.action === "update" && index !== -1 && current && patch.patch) {
      result[index] = {
        ...current,
        ...patch.patch,
        order: current.order,
        title: patch.patch.title ?? current.title,
        description: patch.patch.description ?? current.description,
      };
      continue;
    }

    if (patch.action === "insert_after" && patch.replacement) {
      const insertAt = index === -1 ? result.length : index + 1;
      const newMilestone: JourneyMilestone = {
        order: patch.order,
        title: patch.replacement.title ?? "New milestone",
        description: patch.replacement.description ?? "",
        whyItMatters: patch.replacement.whyItMatters,
        successCriteria: patch.replacement.successCriteria ?? [],
        proofArtifacts: patch.replacement.proofArtifacts ?? [],
        firstStep: patch.replacement.firstStep,
        status: "not_started",
        estimatedMonthsFromNow: patch.replacement.estimatedMonthsFromNow ?? 6,
        salaryBand: patch.replacement.salaryBand ?? { min: 0, max: 0, currency: "USD" },
        requiredSkills: patch.replacement.requiredSkills ?? [],
      };
      result.splice(insertAt, 0, newMilestone);
    }
  }

  result = result
    .sort((a, b) => a.estimatedMonthsFromNow - b.estimatedMonthsFromNow)
    .map((m, i) => ({ ...m, order: i + 1 }));

  return { milestones: result, changedOrders: [...new Set(changedOrders)] };
}

export async function reviseJourney(
  userId: string,
  brief: JourneyRevisionBrief,
): Promise<JourneyReviseResponse | null> {
  const loaded = await loadActiveJourney(userId);
  if (!loaded) return null;

  if (brief.changeScope === "full_rebuild") {
    const mergedPrefs = brief.preferenceUpdates
      ? await journeyService.mergeAndSavePreferences(userId, brief.preferenceUpdates, brief.summary)
      : await journeyService.mergeAndSavePreferences(userId, {}, brief.summary);
    const generated = await journeyService.generateJourney(userId, mergedPrefs);
    if (!generated) return null;
    return {
      journey: generated.journey,
      revisionSummary: brief.summary,
      changedMilestoneOrders: generated.journey.milestones.map((m) => m.order),
    };
  }

  const snapshot = await journeyService.buildProfileSnapshot(userId);
  const llmRevised = snapshot ? await reviseCareerJourney(snapshot, loaded.journey, brief) : null;

  let nextJourney: CareerJourney;
  let changedOrders: number[];

  if (llmRevised) {
    const mergedMilestones = mergePreservedMilestones(
      loaded.journey.milestones,
      llmRevised.milestones as JourneyMilestone[],
      brief,
    );
    nextJourney = {
      ...loaded.journey,
      title: llmRevised.title,
      description: llmRevised.description,
      confidenceScore: llmRevised.confidenceScore,
      projectedTimelineMonths: llmRevised.projectedTimelineMonths,
      details: llmRevised.details ?? loaded.journey.details,
      milestones: mergedMilestones,
    };
    changedOrders = brief.milestonePatches?.map((p) => p.order) ?? [];
  } else {
    nextJourney = applyLocalPatches(loaded.journey, brief);
    changedOrders = applyMilestonePatches(loaded.journey.milestones, brief).changedOrders;
  }

  return persistRevision(
    userId,
    loaded.journey.id,
    nextJourney,
    brief.summary,
    changedOrders,
  );
}

function mergePreservedMilestones(
  existing: JourneyMilestone[],
  proposed: JourneyMilestone[],
  brief: JourneyRevisionBrief,
): JourneyMilestone[] {
  return proposed.map((m) => {
    const prev = existing.find((e) => e.order === m.order);
    if (!prev) return m;
    if (shouldSkipMilestone(prev, brief)) return prev;
    return { ...m, status: prev.status, manuallySet: prev.manuallySet };
  });
}

function applyLocalPatches(journey: CareerJourney, brief: JourneyRevisionBrief): CareerJourney {
  const { milestones } = applyMilestonePatches(journey.milestones, brief);
  const mergedDetails: CareerJourneyDetails | null | undefined = journey.details
    ? {
        ...journey.details,
        ...(brief.journeyPatches?.details as Partial<CareerJourneyDetails> | undefined),
      }
    : journey.details;
  return {
    ...journey,
    title: brief.journeyPatches?.title ?? journey.title,
    description: brief.journeyPatches?.description ?? journey.description,
    projectedTimelineMonths:
      brief.journeyPatches?.projectedTimelineMonths ?? journey.projectedTimelineMonths,
    details: mergedDetails,
    milestones,
  };
}

async function persistRevision(
  userId: string,
  journeyId: string,
  journey: CareerJourney,
  revisionSummary: string,
  changedMilestoneOrders: number[],
): Promise<JourneyReviseResponse> {
  const updated = await prisma.careerPath.update({
    where: { id: journeyId },
    data: {
      title: journey.title,
      description: journey.description,
      confidenceScore: journey.confidenceScore,
      projectedTimelineMonths: journey.projectedTimelineMonths,
      details:
        journey.details == null
          ? Prisma.JsonNull
          : (journey.details as unknown as Prisma.InputJsonValue),
      milestones: journey.milestones as unknown as Prisma.InputJsonValue,
    },
  });

  await ingestEvent(userId, {
    type: "decision",
    source: "user",
    body: revisionSummary,
    structured: { kind: "journey_revision", changedMilestoneOrders },
    occurredAt: new Date(),
  }).catch(() => undefined);

  return {
    journey: {
      id: updated.id,
      profileId: updated.profileId,
      title: updated.title,
      description: updated.description,
      confidenceScore: updated.confidenceScore,
      projectedTimelineMonths: updated.projectedTimelineMonths,
      details: updated.details as CareerJourney["details"],
      milestones: (updated.milestones as unknown as JourneyMilestone[]) ?? [],
    },
    revisionSummary,
    changedMilestoneOrders,
  };
}

export async function previewRevision(
  userId: string,
  conversationId: string,
): Promise<{ brief: JourneyRevisionBrief; preview: JourneyRevisionPreview } | null> {
  const loaded = await loadActiveJourney(userId);
  if (!loaded) return null;

  const brief = await buildRevisionBrief(userId, conversationId);
  if (!brief) return null;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 4 } },
  });
  const lastUser = conversation?.messages.find((m) => m.role === "user");
  const preview = buildRevisionPreview(loaded.journey, brief, lastUser?.content ?? brief.summary);
  return { brief, preview };
}
