import type { AdvisorContext } from "@kursa/types";

import { openai } from "../openai.js";
import { GENERATE_OBSERVATIONS_PROMPT, Models } from "./prompts.js";

export type Observation = {
  text: string;
  timeAgo: string;
  type: "opportunity" | "warning" | "info";
};

export async function generateObservations(context: AdvisorContext): Promise<Observation[]> {
  const payload = {
    signals: context.signals,
    memories: context.memories.map((m) => m.fact),
    recentActivity: context.recentEvents.slice(0, 10).map((e) => ({
      type: e.type,
      body: e.body,
      occurredAt: e.occurredAt,
    })),
    activePathTitle: context.activePath?.title ?? null,
  };

  const response = await openai.chat.completions.create({
    model: Models.fast,
    messages: [
      { role: "system", content: GENERATE_OBSERVATIONS_PROMPT },
      { role: "user", content: JSON.stringify(payload) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 600,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let parsed: {
    observations?: Array<{ text: string; type: string }>;
  };
  try {
    parsed = JSON.parse(content) as {
      observations?: Array<{ text: string; type: string }>;
    };
  } catch {
    throw new Error("OpenAI observations response was not valid JSON");
  }
  const raw = parsed.observations ?? [];

  return raw
    .filter(
      (o) =>
        typeof o.text === "string" &&
        ["opportunity", "warning", "info"].includes(o.type),
    )
    .map((o) => ({
      text: o.text,
      timeAgo: context.signals.recentMemoryFacts.length > 0 ? "noticed · pattern" : "noticed · today",
      type: o.type as Observation["type"],
    }));
}
