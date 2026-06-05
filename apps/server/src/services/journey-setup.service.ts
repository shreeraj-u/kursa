import prisma from "@kursa/db";
import type {
  JourneyIntakeSummary,
  JourneySetupApplyResponse,
  JourneySetupStartResponse,
} from "@kursa/types";

import { extractSetupPreferences } from "../lib/ai/journey.generate.js";
import * as intakeService from "./journey-intake.service.js";
import * as journeyService from "./journey.service.js";

const SETUP_STARTER_CHIPS = [
  "The direction doesn't feel right",
  "I want a slower pace",
  "Prioritize stability over salary",
  "I'm considering a pivot",
  "Add constraints Aria should know",
  "This summary looks right — refine priorities",
];

const INITIAL_SETUP_MESSAGE =
  "Let's shape your journey together. I've read your profile — tell me what direction feels right, what's non-negotiable, and anything to avoid. When you're ready, I'll update your preferences and generate the path.";

export async function startSetupConversation(
  userId: string,
): Promise<JourneySetupStartResponse | null> {
  const intakeSummary = await intakeService.getJourneyIntake(userId);
  if (!intakeSummary) return null;

  const existing = await prisma.conversation.findFirst({
    where: { userId, decisionType: "journey_setup" },
    orderBy: { updatedAt: "desc" },
  });

  let conversationId: string;
  if (existing) {
    conversationId = existing.id;
    const messageCount = await prisma.chatMessage.count({ where: { conversationId } });
    if (messageCount === 0) {
      await seedSetupThread(conversationId, intakeSummary);
    }
  } else {
    const conv = await prisma.conversation.create({
      data: { userId, decisionType: "journey_setup" },
    });
    conversationId = conv.id;
    await seedSetupThread(conversationId, intakeSummary);
  }

  return {
    conversationId,
    intakeSummary,
    initialMessage: INITIAL_SETUP_MESSAGE,
    starterChips: SETUP_STARTER_CHIPS,
  };
}

async function seedSetupThread(conversationId: string, summary: JourneyIntakeSummary) {
  const context = buildSetupContextMessage(summary);
  await prisma.chatMessage.create({
    data: { conversationId, role: "assistant", content: `${INITIAL_SETUP_MESSAGE}\n\n${context}` },
  });
}

function buildSetupContextMessage(summary: JourneyIntakeSummary): string {
  const lines = ["Here's what I already know from your profile:"];
  if (summary.currentRole || summary.targetRole) {
    lines.push(`- Direction: ${summary.currentRole ?? "?"} → ${summary.targetRole ?? "not set"}`);
  }
  if (summary.aspirationSnippet) lines.push(`- 3y horizon: ${summary.aspirationSnippet}`);
  if (summary.topSkills.length) lines.push(`- Top skills: ${summary.topSkills.join(", ")}`);
  if (summary.constraintsSnippet) lines.push(`- Constraints: ${summary.constraintsSnippet}`);
  if (summary.inferredPreferences.preferredDirection) {
    lines.push(`- Inferred direction: ${summary.inferredPreferences.preferredDirection}`);
  }
  return lines.join("\n");
}

export async function applySetupFromConversation(
  userId: string,
  conversationId: string,
  options: { generate?: boolean } = {},
): Promise<JourneySetupApplyResponse | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, decisionType: "journey_setup" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || conversation.messages.length === 0) return null;

  const intake = await intakeService.getJourneyIntake(userId);
  const baseline = intake?.inferredPreferences;

  const preferences =
    (await extractSetupPreferences(
      conversation.messages.map((m) => ({ role: m.role, content: m.content })),
      baseline,
    )) ?? baseline;

  if (!preferences) return null;

  await journeyService.mergeAndSavePreferences(userId, preferences);

  if (!options.generate) {
    return { preferences };
  }

  const generated = await journeyService.generateJourney(userId, preferences);
  if (!generated) return null;

  return {
    preferences,
    journey: generated.journey,
    welcomeSummary: generated.welcomeSummary,
  };
}
