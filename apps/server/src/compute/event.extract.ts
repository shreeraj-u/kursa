import type { CareerEventType } from "@kursa/types";

export type ExtractedEventMeta = {
  sentiment: number | null;
  linkedSkillIds: string[];
};

export function extractFromEvent(
  type: CareerEventType,
  structured: unknown,
): ExtractedEventMeta {
  const data = structured as Record<string, unknown>;

  if (type === "checkin_weekly") {
    const level = typeof data.challengeLevel === "number" ? data.challengeLevel : 3;
    const sentiment = (level - 3) / 2;
    return { sentiment, linkedSkillIds: [] };
  }

  if (type === "checkin_monthly") {
    const satisfaction = typeof data.satisfaction === "number" ? data.satisfaction : 3;
    const sentiment = (satisfaction - 3) / 2;
    return { sentiment, linkedSkillIds: [] };
  }

  return { sentiment: null, linkedSkillIds: [] };
}
