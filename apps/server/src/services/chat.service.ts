import prisma from "@kursa/db";
import type {
  AdvisorContext,
  ChatActionChip,
  ChatDecisionType,
  ChatMetaResponse,
  ChatSendResponse,
  ConversationListItem,
} from "@kursa/types";

import { assembleAdvisorContext } from "../lib/advisor-context.js";
import {
  buildSlimChatContextPayload,
  safeJsonStringify,
  trimChatHistory,
} from "../lib/chat-context.js";
import { openai } from "../lib/openai.js";
import { CHAT_DECISION_PROMPTS, CHAT_SYSTEM_PROMPT, Models } from "../lib/ai/prompts.js";
import { shouldRegeneratePaths } from "../compute/advisor.compute.js";
import { isMarketTableMissingError } from "../lib/market/safe-market-db.js";
import { runChatLearning } from "./chat-learn.service.js";
import { countPendingProposals } from "./skills.service.js";
import { getSkillsOverview } from "./skills-intelligence.service.js";
import { ingestEvent } from "./career-event-intelligence/index.js";

const DECISION_LABELS: Record<ChatDecisionType, string> = {
  offer_evaluation: "Offer evaluation",
  promotion_timing: "Promotion timing",
  education: "Education decision",
  negotiation: "Negotiation",
  general: "Career decision",
};

/** gpt-4o only for these decision threads; all other chat uses gpt-4o-mini. */
const HIGH_STAKES_DECISION_TYPES = new Set<ChatDecisionType>([
  "offer_evaluation",
  "negotiation",
  "promotion_timing",
]);

/** Main-thread upgrade when the user message is clearly high-stakes. */
const HIGH_STAKES_MESSAGE =
  /\b(job offer|offer letter|compensation package|counter[- ]?offer|salary negotiation|should i (?:take|accept) (?:the |this )?offer|negotiat(?:e|ing) (?:my |the )?salary|promotion (?:decision|meeting|case))\b/i;

function shouldUseSmartModel(
  decisionType: ChatDecisionType | null,
  content: string,
): boolean {
  if (decisionType && HIGH_STAKES_DECISION_TYPES.has(decisionType)) {
    return true;
  }
  if (!decisionType && HIGH_STAKES_MESSAGE.test(content)) {
    return true;
  }
  return false;
}

function conversationTitle(
  decisionType: string | null,
  messages: Array<{ role: string; content: string }>,
): string {
  if (decisionType && decisionType in DECISION_LABELS) {
    return DECISION_LABELS[decisionType as ChatDecisionType];
  }
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) {
    const t = firstUser.content.trim();
    return t.length > 48 ? `${t.slice(0, 48)}…` : t;
  }
  return "Main thread";
}

function buildSuggestedPrompts(context: AdvisorContext): string[] {
  const prompts: string[] = [];
  const pathTitle = context.activePath?.title;

  if (context.materialChangeDetected) {
    prompts.push("My profile changed — should we revisit my career paths?");
  }
  if (context.signals.checkInStreak === 0) {
    prompts.push("I haven't checked in lately — what should I focus on this week?");
  }
  if (pathTitle && context.signals.pathMilestonesWithEvidence < context.signals.pathMilestonesTotal) {
    prompts.push(`Am I on track for my next milestone on the ${pathTitle} path?`);
  }
  if (context.marketContext?.available && context.marketContext.sampleRoles?.length) {
    prompts.push("Which of the recent matching roles fits my path best?");
  }
  if (context.signals.intentionActionGap) {
    prompts.push("Where am I misaligned between what I want and what I'm actually doing?");
  }
  prompts.push(
    "How am I tracking against my goals this month?",
    "What should I bring up in my next 1:1?",
  );
  return [...new Set(prompts)].slice(0, 5);
}

function buildSuggestedActions(context: AdvisorContext, decisionType: string | null): ChatActionChip[] {
  const actions: ChatActionChip[] = [];

  if (decisionType) {
    actions.push({
      id: "log-decision",
      label: "Log this decision to journal",
      action: "log_decision",
    });
  }

  if (shouldRegeneratePaths(context.signals) || context.materialChangeDetected) {
    actions.push({
      id: "regen-paths",
      label: "Review career path options",
      action: "regen_paths",
      href: "/dashboard/career-path?regen=1",
    });
  }

  if (context.marketContext?.gaps?.length) {
    actions.push({
      id: "journal-skill",
      label: "Log a win that shows a key skill",
      action: "open_journal",
      href: "/dashboard/journal",
    });
  }

  actions.push({
    id: "open-path",
    label: "Open career path",
    action: "open_career_path",
    href: "/dashboard/career-path",
  });

  return actions.slice(0, 4);
}

async function ensureMainConversation(userId: string): Promise<void> {
  const main = await prisma.conversation.findFirst({
    where: { userId, decisionType: null },
  });
  if (!main) {
    await prisma.conversation.create({ data: { userId, decisionType: null } });
  }
}

export async function listConversations(userId: string): Promise<ConversationListItem[]> {
  await ensureMainConversation(userId);

  const rows = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  const sorted = [...rows].sort((a, b) => {
    if (!a.decisionType && b.decisionType) return -1;
    if (a.decisionType && !b.decisionType) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return sorted.map((c) => ({
    id: c.id,
    decisionType: (c.decisionType as ChatDecisionType | null) ?? null,
    title: conversationTitle(c.decisionType, c.messages),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    messageCount: c.messages.length,
    messages: c.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  }));
}

export async function createConversation(
  userId: string,
  decisionType?: ChatDecisionType,
): Promise<{ id: string }> {
  if (!decisionType) {
    await ensureMainConversation(userId);
    const main = await prisma.conversation.findFirst({
      where: { userId, decisionType: null },
    });
    if (main) return { id: main.id };
  }

  const conv = await prisma.conversation.create({
    data: {
      userId,
      decisionType: decisionType ?? null,
    },
  });
  return { id: conv.id };
}

export async function getChatMeta(userId: string): Promise<ChatMetaResponse> {
  await ensureMainConversation(userId);

  const [memoryCount, main, firstEvent, marketContext, pendingSkillProposals] = await Promise.all([
    prisma.userMemory.count({ where: { userId, validUntil: null } }),
    prisma.conversation.findFirst({ where: { userId, decisionType: null } }),
    prisma.careerEvent.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { occurredAt: "asc" },
      select: { occurredAt: true },
    }),
    import("./market.service.js")
      .then(({ getMarketContextCachedForUser }) => getMarketContextCachedForUser(userId))
      .catch((err) => {
        if (isMarketTableMissingError(err)) return null;
        console.error("[chat] market meta refresh", err);
        return null;
      }),
    countPendingProposals(userId).catch(() => 0),
  ]);

  const contextDays = firstEvent
    ? Math.max(1, Math.floor((Date.now() - firstEvent.occurredAt.getTime()) / 86400000))
    : 0;

  return {
    memoryFactCount: memoryCount,
    contextDays,
    mainConversationId: main?.id ?? null,
    marketAvailable: marketContext?.available ?? false,
    marketAsOf: marketContext?.asOf ?? null,
    marketSources: marketContext?.sources,
    pendingSkillProposals,
    syncedAt: new Date().toISOString(),
  };
}

export async function getSuggestedPrompts(userId: string): Promise<string[]> {
  const context = await assembleAdvisorContext(userId, "chat");
  if (!context) return ["Tell me about my career path options."];
  return buildSuggestedPrompts(context);
}

export async function sendChatMessage(
  userId: string,
  conversationId: string,
  content: string,
): Promise<ChatSendResponse> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
  });

  if (!conversation) throw new Error("Conversation not found");

  const userMessage = await prisma.chatMessage.create({
    data: { conversationId, role: "user", content },
  });

  const context = await assembleAdvisorContext(userId, "chat");
  if (!context) throw new Error("Profile not found");

  const skillsOverview = await getSkillsOverview(userId).catch(() => null);
  const contextPayload = buildSlimChatContextPayload(context, {
    recommendations: skillsOverview?.recommendations,
    proposals: skillsOverview?.proposals,
  });
  const decisionOverlay =
    conversation.decisionType && CHAT_DECISION_PROMPTS[conversation.decisionType]
      ? CHAT_DECISION_PROMPTS[conversation.decisionType]
      : null;

  const history = trimChatHistory(
    conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  );

  const useSmart = shouldUseSmartModel(
    (conversation.decisionType as ChatDecisionType | null) ?? null,
    content,
  );

  let assistantContent: string;
  try {
    const response = await openai.chat.completions.create({
      model: useSmart ? Models.smart : Models.fast,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        {
          role: "system",
          content: `USER_CONTEXT:\n${safeJsonStringify(contextPayload)}`,
        },
        ...(decisionOverlay ? [{ role: "system" as const, content: decisionOverlay }] : []),
        ...history,
        { role: "user", content },
      ],
      temperature: 0.4,
    });
    assistantContent =
      response.choices[0]?.message?.content ??
      "I'm having trouble responding right now. Please try again.";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[chat] OpenAI request failed:", message);
    assistantContent =
      "I'm having trouble responding right now — often this happens when the thread gets long or the AI service is busy. Please try again, or start a shorter follow-up.";
  }

  const assistantMessage = await prisma.chatMessage.create({
    data: { conversationId, role: "assistant", content: assistantContent },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  let memoriesLearned = 0;
  let skillProposals: ChatSendResponse["skillProposals"];

  try {
    const learnResult = await Promise.race([
      runChatLearning({
        userId,
        conversationId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        userContent: content,
        assistantContent,
        decisionType: conversation.decisionType,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4_000)),
    ]);

    if (learnResult) {
      memoriesLearned = learnResult.memoriesLearned;
      skillProposals = learnResult.skillProposals;
    }
  } catch (err) {
    console.error("[chat] learning failed", conversationId, err);
  }

  if (conversation.decisionType && content.length > 50) {
    await ingestEvent(userId, {
      type: "decision",
      source: "user",
      body: content,
      structured: {
        title: `Chat: ${conversation.decisionType}`,
        optionsConsidered: [],
        choiceMade: content.slice(0, 200),
        reasoning: assistantContent.slice(0, 500),
        conversationId,
      },
      skipDistill: false,
    });
  }

  return {
    message: assistantContent,
    conversationId,
    suggestedPrompts: buildSuggestedPrompts(context),
    suggestedActions: buildSuggestedActions(
      context,
      conversation.decisionType,
    ),
    memoriesLearned,
    skillProposals,
  };
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, decisionType: true },
  });

  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.decisionType) {
    throw new Error("The main thread cannot be deleted");
  }

  await prisma.conversation.delete({ where: { id: conversationId } });
}

export async function recordDecisionFromChat(
  userId: string,
  input: {
    conversationId: string;
    title: string;
    optionsConsidered: string[];
    choiceMade: string;
    reasoning: string;
  },
): Promise<void> {
  await ingestEvent(userId, {
    type: "decision",
    source: "user",
    body: input.reasoning,
    structured: { ...input },
  });
}
