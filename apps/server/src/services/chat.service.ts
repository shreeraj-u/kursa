import prisma from "@kursa/db";
import type { ChatDecisionType, ConversationSummary } from "@kursa/types";

import { assembleAdvisorContext } from "../lib/advisor-context.js";
import { openai } from "../lib/openai.js";
import { Models } from "../lib/ai/prompts.js";
import { ingestEvent } from "./career-event-intelligence/index.js";

const CHAT_SYSTEM_PROMPT = `You are Kursa's AI career advisor (Aria). You have full context of the user's profile, memories, recent activity, and active career path.

Rules:
- Frame advice as perspective, not directives
- Surface uncertainty when it exists
- Cite specific skills, wins, or memories from the context when relevant
- Keep responses concise (2-4 paragraphs max)
- Reference evidence from their journal when possible`;

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const rows = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    decisionType: (c.decisionType as ChatDecisionType | null) ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
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
  const conv = await prisma.conversation.create({
    data: {
      userId,
      decisionType: decisionType ?? null,
    },
  });
  return { id: conv.id };
}

export async function sendChatMessage(
  userId: string,
  conversationId: string,
  content: string,
): Promise<{ message: string; conversationId: string }> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
  });

  if (!conversation) throw new Error("Conversation not found");

  await prisma.chatMessage.create({
    data: { conversationId, role: "user", content },
  });

  const context = await assembleAdvisorContext(userId, "chat");
  if (!context) throw new Error("Profile not found");

  const contextPayload = {
    profile: {
      targetRole: context.profile.targetRole,
      careerTrajectory: context.profile.careerTrajectory,
      skills: context.profile.skills.slice(0, 15).map((s) => s.name),
    },
    signals: {
      winsThisQuarter: context.signals.winsThisQuarter,
      checkInStreak: context.signals.checkInStreak,
      sentimentTrend12w: context.signals.sentimentTrend12w,
    },
    memories: context.memories.map((m) => m.fact),
    recentEvents: context.recentEvents.slice(0, 8).map((e) => ({
      type: e.type,
      body: e.body?.slice(0, 200),
      themes: e.enrichment?.themes,
    })),
    activePath: context.activePath?.title ?? null,
  };

  const history = conversation.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await openai.chat.completions.create({
    model: Models.fast,
    messages: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "system", content: `User context:\n${JSON.stringify(contextPayload)}` },
      ...history,
      { role: "user", content },
    ],
    temperature: 0.4,
  });

  const assistantContent =
    response.choices[0]?.message?.content ??
    "I'm having trouble responding right now. Please try again.";

  await prisma.chatMessage.create({
    data: { conversationId, role: "assistant", content: assistantContent },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

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

  return { message: assistantContent, conversationId };
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
