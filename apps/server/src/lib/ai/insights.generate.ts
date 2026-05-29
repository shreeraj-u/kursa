import type { ProfileSignals } from "@kursa/types";

import { openai } from "../openai.js";
import { GENERATE_OBSERVATIONS_PROMPT, Models } from "./prompts.js";

export type Observation = {
  text: string;
  timeAgo: string;
  type: "opportunity" | "warning" | "info";
};

export async function generateObservations(signals: ProfileSignals): Promise<Observation[]> {
  const response = await openai.chat.completions.create({
    model: Models.fast,
    messages: [
      { role: "system", content: GENERATE_OBSERVATIONS_PROMPT },
      { role: "user", content: JSON.stringify(signals) },
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
      timeAgo: "noticed · today",
      type: o.type as Observation["type"],
    }));
}
