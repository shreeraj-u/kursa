import { CareerTrajectory } from "@kursa/db";

import { openai } from "../openai.js";
import { CLASSIFY_TRAJECTORY_PROMPT, Models } from "./prompts.js";

type WorkHistoryEntry = {
  roleTitle: string;
  companyName: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
};

export async function classifyCareerTrajectory(
  workHistories: WorkHistoryEntry[],
): Promise<CareerTrajectory> {
  const formatted = [...workHistories]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map((w) => {
      const start = new Date(w.startDate).getFullYear();
      const end = w.isCurrent
        ? "present"
        : w.endDate
          ? new Date(w.endDate).getFullYear()
          : "unknown";
      return `${start}–${end}: ${w.roleTitle} at ${w.companyName}`;
    })
    .join("\n");

  const response = await openai.chat.completions.create({
    model: Models.fast,
    messages: [
      { role: "system", content: CLASSIFY_TRAJECTORY_PROMPT },
      {
        role: "user",
        content: `Work history:\n${formatted}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 50,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { trajectory?: string };
  const t = parsed.trajectory;

  if (
    t === CareerTrajectory.linear ||
    t === CareerTrajectory.accelerating ||
    t === CareerTrajectory.stagnating ||
    t === CareerTrajectory.pivoting
  ) {
    return t;
  }

  return CareerTrajectory.linear;
}
