import type { AdvisorSignals } from "@kursa/types";

import type { Observation } from "../lib/ai/insights.generate.js";

export function generateRuleBasedObservations(signals: AdvisorSignals): Observation[] {
  const observations: Observation[] = [];

  if (signals.dormantHighValueSkills.length > 0) {
    observations.push({
      text: `Your ${signals.dormantHighValueSkills.slice(0, 2).join(" and ")} skills haven't been used recently — logging a win that uses them keeps your profile current.`,
      type: "warning",
      timeAgo: "noticed · today",
    });
  }

  if (signals.overdueGoals.length > 0) {
    observations.push({
      text: `You have ${signals.overdueGoals.length} learning goal${signals.overdueGoals.length > 1 ? "s" : ""} past deadline.`,
      type: "warning",
      timeAgo: "noticed · today",
    });
  }

  if (signals.profileCompleteness < 60) {
    observations.push({
      text: `Your profile is ${signals.profileCompleteness}% complete — adding work outcomes and skills unlocks sharper guidance.`,
      type: "opportunity",
      timeAgo: "noticed · today",
    });
  }

  if (signals.winsThisQuarter === 0) {
    observations.push({
      text: "No accomplishments logged this quarter yet — even small wins help Aria track your momentum.",
      type: "info",
      timeAgo: "noticed · today",
    });
  }

  if (observations.length === 0) {
    observations.push({
      text: "Keep logging journal entries and check-ins — Aria learns more with each entry.",
      type: "info",
      timeAgo: "noticed · today",
    });
  }

  return observations.slice(0, 5);
}
