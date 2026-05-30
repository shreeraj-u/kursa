import prisma from "@kursa/db";
import type { ReviewPrepResponse } from "@kursa/types";

import { openai } from "../lib/openai.js";
import { Models } from "../lib/ai/prompts.js";

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
      sections: [{ theme: "Activity", bullets: ["No wins or feedback logged in this period."] }],
    };
  }

  const grouped = groupByTheme(events);
  const sections = [];

  for (const [theme, items] of Object.entries(grouped)) {
    let bullets: string[];
    try {
      bullets = await rewriteBullets(items.map((i) => i.body ?? "").filter(Boolean));
    } catch {
      bullets = items.map((i) => i.body ?? "").filter(Boolean);
    }
    sections.push({ theme, bullets });
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    sections,
  };
}

function groupByTheme(
  events: Array<{ type: string; body: string | null; structured: unknown }>,
): Record<string, typeof events> {
  const themes: Record<string, typeof events> = {
    Wins: [],
    Feedback: [],
  };

  for (const event of events) {
    if (event.type === "win") themes.Wins!.push(event);
    else themes.Feedback!.push(event);
  }

  return Object.fromEntries(Object.entries(themes).filter(([, v]) => v.length > 0));
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
