import type { CareerEventType } from "@kursa/types";
import type { ProfileUpdateDelta } from "@kursa/types";

export type CareerEventForDelta = {
  id: string;
  type: CareerEventType;
  body: string | null;
  structured: unknown;
};

export function computeProfileUpdateDelta(event: CareerEventForDelta): ProfileUpdateDelta {
  const structured = event.structured as Record<string, unknown>;

  switch (event.type) {
    case "win": {
      const title = String(structured.title ?? event.body ?? "Win");
      const body = String(structured.body ?? "");
      const skillNames = Array.isArray(structured.skillNames)
        ? (structured.skillNames as string[]).filter(Boolean)
        : [];
      return {
        newAchievements: [
          {
            title,
            description: body || undefined,
            dateAchieved: new Date(),
            skillNames,
          },
        ],
        skillLastUsed: skillNames.map((name) => ({ name, date: new Date() })),
      };
    }
    case "checkin_weekly": {
      const rememberThis =
        typeof structured.rememberThis === "string" ? structured.rememberThis.trim() : "";
      const skillNames = extractSkillMentions(rememberThis);
      if (skillNames.length === 0) return {};
      return { skillLastUsed: skillNames.map((name) => ({ name, date: new Date() })) };
    }
    case "learning": {
      const skillName = String(structured.skillName ?? "").trim();
      if (!skillName) return {};
      return {
        newLearningGoals: [{ skillName }],
        skillLastUsed: [{ name: skillName, date: new Date() }],
      };
    }
    case "feedback": {
      const body = String(structured.body ?? event.body ?? "");
      if (body.length < 40) return {};
      return {
        newAchievements: [
          {
            title: "Feedback captured",
            description: body,
            dateAchieved: new Date(),
          },
        ],
      };
    }
    default:
      return {};
  }
}

function extractSkillMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\b[A-Z][a-zA-Z+#.]{1,24}\b/g) ?? [];
  return [...new Set(matches)].slice(0, 5);
}
