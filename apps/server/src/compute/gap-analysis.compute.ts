import type { MarketGapHighlight } from "@kursa/types";

import type { ProfileInput } from "@kursa/types";

export function computeMarketGaps(
  profile: ProfileInput,
  topSkillsFromMarket: Array<{ skill: string; frequencyPct: number }>,
): MarketGapHighlight[] {
  const userSkills = new Set(profile.skills.map((s) => s.name.toLowerCase()));
  const gaps: MarketGapHighlight[] = [];

  for (const { skill, frequencyPct } of topSkillsFromMarket.slice(0, 12)) {
    if (frequencyPct < 15) continue;
    const key = skill.toLowerCase();
    if (userSkills.has(key)) continue;
    gaps.push({
      skill,
      gapType: "missing",
      marketFrequency: frequencyPct,
    });
  }

  const eighteenMonthsAgo = Date.now() - 18 * 30 * 24 * 60 * 60 * 1000;
  for (const s of profile.skills) {
    const last = s.lastUsedDate ? new Date(s.lastUsedDate).getTime() : 0;
    if (last > 0 && last < eighteenMonthsAgo) {
      gaps.push({
        skill: s.name,
        gapType: "outdated",
        marketFrequency: 0,
      });
    }
  }

  return gaps.slice(0, 8);
}
