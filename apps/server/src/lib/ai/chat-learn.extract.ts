import type { ChatInsightFact } from "@kursa/types";

import {
  Models,
  CHAT_CONVERSATION_DIGEST_PROMPT,
  CHAT_LEARN_PROMPT,
  CHAT_SKILL_EXTRACT_PROMPT,
} from "./prompts.js";
import { openai } from "../openai.js";

const CONFIDENCE_FLOOR = 0.6;
const MAX_MEMORIES_PER_MESSAGE = 3;

export type ChatLearnExtraction = {
  shouldPersist: boolean;
  memories: ChatInsightFact[];
};

export type ChatSkillDetection = {
  name: string;
  category: "technical" | "soft" | "tool";
  action: "add" | "improve" | "learning";
  confidence: number;
  evidenceQuote: string;
};

const SKILL_CONFIDENCE_FLOOR = 0.55;

export async function extractChatMemoriesWithLlm(input: {
  userMessage: string;
  assistantMessage?: string;
  existingMemories: string[];
  profileSnapshot: {
    targetRole: string | null;
    currentEmployer: string | null;
    currentRole: string | null;
  };
}): Promise<ChatLearnExtraction> {
  if (!input.userMessage.trim()) {
    return { shouldPersist: false, memories: [] };
  }

  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: CHAT_LEARN_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            userMessage: input.userMessage.slice(0, 2_000),
            assistantMessage: input.assistantMessage?.slice(0, 1_000),
            existingMemories: input.existingMemories.slice(0, 10),
            profileSnapshot: input.profileSnapshot,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return { shouldPersist: false, memories: [] };

    const parsed = JSON.parse(raw) as {
      shouldPersist?: boolean;
      memories?: Array<{ category?: string; fact?: string; confidence?: number }>;
    };

    const memories = (parsed.memories ?? [])
      .filter(
        (m): m is ChatInsightFact =>
          typeof m.category === "string" &&
          typeof m.fact === "string" &&
          m.fact.trim().length > 10 &&
          typeof m.confidence === "number" &&
          m.confidence >= CONFIDENCE_FLOOR,
      )
      .slice(0, MAX_MEMORIES_PER_MESSAGE);

    return {
      shouldPersist: Boolean(parsed.shouldPersist) && memories.length > 0,
      memories,
    };
  } catch {
    return { shouldPersist: false, memories: [] };
  }
}

export async function extractSkillsFromChatMessage(
  userMessage: string,
  existingSkillNames: string[],
): Promise<ChatSkillDetection[]> {
  if (!userMessage.trim()) return [];

  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: CHAT_SKILL_EXTRACT_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            userMessage: userMessage.slice(0, 2_000),
            existingSkills: existingSkillNames.slice(0, 30),
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.15,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return [];

    const parsed = JSON.parse(raw) as {
      skills?: Array<{
        name?: string;
        category?: string;
        action?: string;
        confidence?: number;
        evidenceQuote?: string;
      }>;
    };

    return (parsed.skills ?? [])
      .filter(
        (s): s is ChatSkillDetection =>
          typeof s.name === "string" &&
          s.name.trim().length > 1 &&
          (s.category === "technical" || s.category === "soft" || s.category === "tool") &&
          (s.action === "add" || s.action === "improve" || s.action === "learning") &&
          typeof s.confidence === "number" &&
          s.confidence >= SKILL_CONFIDENCE_FLOOR,
      )
      .slice(0, 3)
      .map((s) => ({
        name: s.name.trim(),
        category: s.category,
        action: s.action,
        confidence: s.confidence,
        evidenceQuote: (s.evidenceQuote ?? s.name).slice(0, 200),
      }));
  } catch {
    return [];
  }
}

export async function extractConversationDigestWithLlm(
  messages: Array<{ role: string; content: string }>,
  existingMemories: string[],
): Promise<ChatInsightFact[]> {
  if (messages.length < 4) return [];

  const transcript = messages
    .slice(-20)
    .map((m) => `${m.role}: ${m.content.slice(0, 500)}`)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: CHAT_CONVERSATION_DIGEST_PROMPT },
        {
          role: "user",
          content: JSON.stringify({ transcript, existingMemories: existingMemories.slice(0, 15) }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return [];

    const parsed = JSON.parse(raw) as {
      memories?: Array<{ category?: string; fact?: string; confidence?: number }>;
    };

    return (parsed.memories ?? [])
      .filter(
        (m): m is ChatInsightFact =>
          typeof m.category === "string" &&
          typeof m.fact === "string" &&
          m.fact.trim().length > 10 &&
          typeof m.confidence === "number" &&
          m.confidence >= CONFIDENCE_FLOOR,
      )
      .slice(0, 2);
  } catch {
    return [];
  }
}
