import prisma from "@kursa/db";
import type { ReviewPrepBullet, ReviewPrepResponse } from "@kursa/types";

import { openai } from "../lib/openai.js";
import { Models } from "../lib/ai/prompts.js";

type ReviewEvent = {
  id: string;
  type: string;
  body: string | null;
  structured: unknown;
};

export async function generateReviewPrep(
  userId: string,
  from: Date,
  to: Date,
): Promise<ReviewPrepResponse | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const events = await prisma.careerEvent.findMany({
    where: {
      userId,
      type: { in: ["win", "feedback"] },
      occurredAt: { gte: from, lte: to },
      deletedAt: null,
    },
    orderBy: { occurredAt: "asc" },
  });

  if (events.length === 0) {
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      sections: [
        {
          theme: "Activity",
          bullets: [{ text: "No wins or feedback logged in this period." }],
        },
      ],
    };
  }

  const wins = events.filter((e) => e.type === "win");
  const feedback = events.filter((e) => e.type === "feedback");

  const sections: ReviewPrepResponse["sections"] = [];

  if (wins.length > 0) {
    const winSections = await buildWinSections(wins);
    sections.push(...winSections);
  }

  if (feedback.length > 0) {
    sections.push(await buildFeedbackSection(feedback));
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    sections,
  };
}

async function buildWinSections(wins: ReviewEvent[]): Promise<ReviewPrepResponse["sections"]> {
  if (wins.length >= 3) {
    try {
      const themed = await groupWinsByImpactTheme(wins);
      if (themed.length > 0) return themed;
    } catch {
      /* fall through to single Wins section */
    }
  }

  return [await buildBulletSection("Wins", wins)];
}

async function buildFeedbackSection(items: ReviewEvent[]): Promise<ReviewPrepResponse["sections"][0]> {
  return buildBulletSection("Feedback", items);
}

async function buildBulletSection(
  theme: string,
  items: ReviewEvent[],
): Promise<{ theme: string; bullets: ReviewPrepBullet[] }> {
  const rawTexts = items.map((i) => i.body ?? "").filter(Boolean);
  let bullets: ReviewPrepBullet[];

  try {
    const texts = await rewriteBullets(rawTexts);
    bullets = texts.map((text, i) => ({
      text,
      sourceEventId: items[i]?.id,
    }));
  } catch {
    bullets = items
      .map((i) => ({ text: i.body ?? "", sourceEventId: i.id }))
      .filter((b) => b.text);
  }

  return { theme, bullets };
}

async function groupWinsByImpactTheme(
  wins: ReviewEvent[],
): Promise<ReviewPrepResponse["sections"]> {
  const payload = wins.map((w) => ({
    id: w.id,
    text: w.body ?? "",
  }));

  const response = await openai.chat.completions.create({
    model: Models.fast,
    messages: [
      {
        role: "system",
        content: `Group career wins into impact themes for a performance review.
Use themes like Leadership, Technical impact, Collaboration, or other concise labels.
Return JSON: { sections: [{ theme: string, eventIds: string[] }] }
Each event id must appear in exactly one section.`,
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 600,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as {
    sections?: Array<{ theme: string; eventIds: string[] }>;
  };

  const byId = new Map(wins.map((w) => [w.id, w]));
  const result: ReviewPrepResponse["sections"] = [];

  for (const section of parsed.sections ?? []) {
    const items = section.eventIds.map((id) => byId.get(id)).filter(Boolean) as ReviewEvent[];
    if (items.length === 0) continue;
    result.push(await buildBulletSection(section.theme, items));
  }

  return result;
}

async function rewriteBullets(raw: string[]): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: Models.fast,
    messages: [
      {
        role: "system",
        content:
          "Rewrite each career note as a strong impact bullet for a performance review. Return JSON: { bullets: string[] }",
      },
      { role: "user", content: JSON.stringify(raw) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { bullets?: string[] };
  return parsed.bullets ?? raw;
}
