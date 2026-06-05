const MAX_LABEL_LEN = 40;

/** Heuristic shorten for legacy learning goals stored as full journal text. */
export function formatLearningGoalLabel(skillName: string, maxLen = MAX_LABEL_LEN): string {
  const trimmed = skillName.trim();
  if (!trimmed) return "Learning goal";
  if (trimmed.length <= maxLen) return trimmed;

  const learnedMatch = trimmed.match(
    /(?:learned|learning|studying|picked up)\s+(?:about\s+)?([^,.;]+)/i,
  );
  if (learnedMatch?.[1]) {
    const topic = learnedMatch[1].trim();
    if (topic.length >= 3 && topic.length <= maxLen) return topic;
  }

  const firstClause = trimmed.split(/[,;]/)[0]?.trim();
  if (firstClause && firstClause.length >= 3 && firstClause.length <= maxLen) {
    return firstClause;
  }

  const words = trimmed.split(/\s+/).slice(0, 5).join(" ");
  if (words.length <= maxLen) return words;

  return `${trimmed.slice(0, maxLen - 1)}…`;
}
