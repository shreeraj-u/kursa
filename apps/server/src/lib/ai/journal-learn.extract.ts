import { formatLearningGoalLabel } from "../learning-goal-label.js";
import { openai } from "../openai.js";
import { LEARNING_GOAL_EXTRACT_PROMPT, Models } from "./prompts.js";

export type LearningGoalExtraction = {
  skillName: string;
  summary: string;
};

export async function extractLearningGoalFromText(
  journalText: string,
): Promise<LearningGoalExtraction | null> {
  const trimmed = journalText.trim();
  if (!trimmed) return null;

  if (trimmed.length <= 40 && !trimmed.includes("\n")) {
    return { skillName: trimmed, summary: trimmed };
  }

  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: LEARNING_GOAL_EXTRACT_PROMPT },
        { role: "user", content: trimmed.slice(0, 2_000) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.15,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { skillName?: string; summary?: string };
    const skillName = parsed.skillName?.trim();
    if (!skillName || skillName.length > 60) return null;

    return {
      skillName,
      summary: (parsed.summary?.trim() || trimmed).slice(0, 500),
    };
  } catch {
    return null;
  }
}

export function fallbackLearningGoalExtraction(journalText: string): LearningGoalExtraction {
  return {
    skillName: formatLearningGoalLabel(journalText),
    summary: journalText.trim().slice(0, 500),
  };
}
