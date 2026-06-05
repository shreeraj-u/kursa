import prisma from "@kursa/db";
import { env } from "@kursa/env/server";
import type { ChatInsightStructured } from "@kursa/types";

import {
  extractChatMemoriesWithLlm,
  extractConversationDigestWithLlm,
  extractSkillsFromChatMessage,
} from "../lib/ai/chat-learn.extract.js";
import { normalizeSkillName } from "../lib/skill-normalize.js";
import { upsertSkillProposal } from "./skills.service.js";
import { assembleAdvisorContext } from "../lib/advisor-context.js";
import { ingestEvent } from "./events.service.js";
import { getMemoriesForUser, mergeMemoryCandidates } from "./memory.service.js";

const MIN_MESSAGE_LENGTH = 40;
const PLATITUDE = /^(thanks|thank you|thx|ok|okay|yes|no|got it|cool|great|sure|sounds good)\.?$/i;
const FACTUAL_SIGNAL =
  /\b(i work at|my (job|role|company|employer|goal|manager|salary|team)|remember|i'm (a|an|the)|targeting|promoted|offer|blocker|last win|currently at|years? (of )?experience)\b/i;

function maxLearnPerDay(): number {
  return env.CHAT_LEARN_MAX_PER_DAY ?? 30;
}

function normalizeForDedupe(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
}

export function shouldAttemptChatLearning(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed || PLATITUDE.test(trimmed)) return false;
  if (trimmed.length >= MIN_MESSAGE_LENGTH) return true;
  return FACTUAL_SIGNAL.test(trimmed);
}

async function countChatInsightsToday(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rows = await prisma.careerEvent.findMany({
    where: {
      userId,
      type: "chat_insight",
      deletedAt: null,
      occurredAt: { gte: startOfDay },
    },
    select: { structured: true },
  });

  return rows.filter((r) => {
    const kind = (r.structured as unknown as ChatInsightStructured | null)?.kind;
    return kind !== "conversation_digest";
  }).length;
}

async function wasMessageAlreadyLearned(
  userId: string,
  conversationId: string,
  normalizedMessage: string,
): Promise<boolean> {
  const recent = await prisma.careerEvent.findMany({
    where: {
      userId,
      type: "chat_insight",
      deletedAt: null,
      occurredAt: { gte: new Date(Date.now() - 86400000) },
    },
    select: { body: true, structured: true },
    take: 20,
    orderBy: { occurredAt: "desc" },
  });

  for (const event of recent) {
    const structured = event.structured as unknown as ChatInsightStructured | null;
    if (structured?.conversationId !== conversationId) continue;
    if (normalizeForDedupe(event.body ?? "") === normalizedMessage) return true;
  }
  return false;
}

function filterNewMemories(
  candidates: Array<{ category: string; fact: string; confidence: number }>,
  existingFacts: string[],
): Array<{ category: string; fact: string; confidence: number }> {
  const existingNorm = new Set(existingFacts.map((f) => f.trim().toLowerCase()));
  return candidates.filter((c) => {
    const norm = c.fact.trim().toLowerCase();
    if (existingNorm.has(norm)) return false;
    return !existingFacts.some(
      (e) => e.length > 20 && (norm.includes(e.toLowerCase()) || e.toLowerCase().includes(norm)),
    );
  });
}

async function persistChatInsights(
  userId: string,
  payload: {
    conversationId: string;
    userMessageId: string;
    assistantMessageId?: string;
    userContent: string;
    facts: Array<{ category: string; fact: string; confidence: number }>;
    kind: "message" | "conversation_digest";
  },
): Promise<number> {
  if (payload.facts.length === 0) return 0;

  const structured: ChatInsightStructured = {
    conversationId: payload.conversationId,
    userMessageId: payload.userMessageId,
    assistantMessageId: payload.assistantMessageId,
    kind: payload.kind,
    extractedFacts: payload.facts,
  };

  const journalBody =
    payload.facts.length > 0
      ? `Aria noted: ${payload.facts.map((f) => f.fact).join(" ")}`
      : payload.userContent.slice(0, 500);

  const event = await ingestEvent(userId, {
    type: "chat_insight",
    source: "aria",
    body: journalBody.slice(0, 500),
    structured,
    skipDelta: true,
    skipDistill: true,
    skipEnrich: true,
  });

  await mergeMemoryCandidates(
    userId,
    payload.facts.map((f) => ({
      category: f.category,
      fact: f.fact,
      confidence: f.confidence,
      sourceEntryIds: [event.id],
    })),
  );

  return payload.facts.length;
}

export type ChatLearningResult = {
  memoriesLearned: number;
  skillProposals: Array<{
    id: string;
    displayName: string;
    evidence: string;
    proposalType: "add" | "update_confidence" | "mark_learning" | "mark_stale";
  }>;
};

function isPlatitudeOnly(content: string): boolean {
  const trimmed = content.trim();
  return !trimmed || PLATITUDE.test(trimmed);
}

export async function runChatSkillDetection(input: {
  userId: string;
  conversationId: string;
  userMessageId: string;
  userContent: string;
}): Promise<ChatLearningResult["skillProposals"]> {
  if (isPlatitudeOnly(input.userContent)) return [];

  const context = await assembleAdvisorContext(input.userId, "chat");
  if (!context) return [];

  const existingNames = context.profile.skills.map((s) => s.name);
  const detected = await extractSkillsFromChatMessage(input.userContent, existingNames);
  const proposals: ChatLearningResult["skillProposals"] = [];

  for (const skill of detected) {
    const canonical = normalizeSkillName(skill.name);
    const hasSkill = existingNames.some(
      (n) => n.toLowerCase() === canonical.toLowerCase(),
    );

    const proposalType =
      skill.action === "improve"
        ? ("update_confidence" as const)
        : hasSkill
          ? ("mark_learning" as const)
          : ("add" as const);

    const evidence =
      proposalType === "add"
        ? `You mentioned ${canonical} — add it to your skills?`
        : proposalType === "mark_learning"
          ? `You mentioned learning ${canonical}`
          : `You mentioned improving ${canonical}`;

    const row = await upsertSkillProposal(input.userId, {
      canonicalName: canonical,
      displayName: skill.name,
      category: skill.category,
      proposalType,
      suggestedConfidence: Math.min(5, Math.max(1, Math.round(skill.confidence * 5))),
      source: "chat",
      sourceRef: {
        conversationId: input.conversationId,
        messageId: input.userMessageId,
      },
      evidence,
    });

    if (row) {
      proposals.push({
        id: row.id,
        displayName: row.displayName,
        evidence: row.evidence,
        proposalType: row.proposalType,
      });
    }
  }

  return proposals;
}

export async function runChatMemoryLearning(input: {
  userId: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  userContent: string;
  assistantContent: string;
  skipDecisionThread: boolean;
}): Promise<number> {
  if (input.skipDecisionThread) return 0;
  if (!shouldAttemptChatLearning(input.userContent)) return 0;

  const normalized = normalizeForDedupe(input.userContent);
  if (await wasMessageAlreadyLearned(input.userId, input.conversationId, normalized)) {
    return 0;
  }

  const todayCount = await countChatInsightsToday(input.userId);
  if (todayCount >= maxLearnPerDay()) return 0;

  const context = await assembleAdvisorContext(input.userId, "chat");
  if (!context) return 0;

  const existingMemories = context.memories.map((m) => m.fact);
  const currentJob =
    context.profile.workHistories.find((w) => w.isCurrent) ??
    context.profile.workHistories[0];

  const extraction = await extractChatMemoriesWithLlm({
    userMessage: input.userContent,
    assistantMessage: input.assistantContent,
    existingMemories,
    profileSnapshot: {
      targetRole: context.profile.targetRole,
      currentEmployer: currentJob?.companyName ?? null,
      currentRole: currentJob?.roleTitle ?? null,
    },
  });

  if (!extraction.shouldPersist || extraction.memories.length === 0) return 0;

  const novel = filterNewMemories(extraction.memories, existingMemories);
  if (novel.length === 0) return 0;

  const summary = novel.map((f) => f.fact).join(" · ");
  return persistChatInsights(input.userId, {
    conversationId: input.conversationId,
    userMessageId: input.userMessageId,
    assistantMessageId: input.assistantMessageId,
    userContent: summary || input.userContent,
    facts: novel,
    kind: "message",
  });
}

export async function runChatLearning(input: {
  userId: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  userContent: string;
  assistantContent: string;
  decisionType: string | null;
}): Promise<ChatLearningResult> {
  const [skillProposals, memoriesLearned] = await Promise.all([
    runChatSkillDetection({
      userId: input.userId,
      conversationId: input.conversationId,
      userMessageId: input.userMessageId,
      userContent: input.userContent,
    }),
    runChatMemoryLearning({
      ...input,
      skipDecisionThread: Boolean(input.decisionType),
    }),
  ]);

  return { memoriesLearned, skillProposals };
}

export function scheduleChatLearning(input: {
  userId: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  userContent: string;
  assistantContent: string;
  decisionType: string | null;
}): void {
  void runChatLearning(input).catch((err) => {
    console.error("[chat-learn] failed", input.conversationId, err);
  });
}

export async function runConversationDigestForUser(
  userId: string,
  conversationId: string,
): Promise<number> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 30 },
    },
  });

  if (!conversation || conversation.decisionType) return 0;
  if (conversation.messages.length < 5) return 0;

  const idleMs = Date.now() - conversation.updatedAt.getTime();
  if (idleMs < 10 * 60 * 1000) return 0;

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const recentDigests = await prisma.careerEvent.findMany({
    where: {
      userId,
      type: "chat_insight",
      deletedAt: null,
      occurredAt: { gte: weekAgo },
    },
    select: { structured: true },
    take: 50,
  });

  const alreadyDigested = recentDigests.some((row) => {
    const s = row.structured as unknown as ChatInsightStructured;
    return s?.kind === "conversation_digest" && s.conversationId === conversationId;
  });
  if (alreadyDigested) return 0;

  const memories = await getMemoriesForUser(userId, 15);
  const facts = await extractConversationDigestWithLlm(
    conversation.messages.map((m) => ({ role: m.role, content: m.content })),
    memories.map((m) => m.fact),
  );

  const novel = filterNewMemories(facts, memories.map((m) => m.fact));
  if (novel.length === 0) return 0;

  const lastUser = [...conversation.messages].reverse().find((m) => m.role === "user");
  const lastAssistant = [...conversation.messages]
    .reverse()
    .find((m) => m.role === "assistant");

  return persistChatInsights(userId, {
    conversationId,
    userMessageId: lastUser?.id ?? conversation.messages[0]!.id,
    assistantMessageId: lastAssistant?.id,
    userContent: `[conversation digest] ${conversation.messages.length} messages`,
    facts: novel,
    kind: "conversation_digest",
  });
}

export async function runChatConversationDigestSweep(): Promise<void> {
  const idleBefore = new Date(Date.now() - 10 * 60 * 1000);

  const conversations = await prisma.conversation.findMany({
    where: {
      decisionType: null,
      updatedAt: { lt: idleBefore },
    },
    select: { id: true, userId: true, _count: { select: { messages: true } } },
    take: 100,
    orderBy: { updatedAt: "desc" },
  });

  for (const conv of conversations) {
    if (conv._count.messages < 5) continue;
    try {
      await runConversationDigestForUser(conv.userId, conv.id);
    } catch (err) {
      console.error("[chat-learn] digest failed", conv.id, err);
    }
  }
}
