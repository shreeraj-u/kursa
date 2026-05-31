import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildRuleEnrichment,
  extractThemes,
  matchMilestonesByKeywords,
  estimateSentiment,
} from "../compute/enrichment.rules.js";
import { computeJournalActivityScore, shouldRegeneratePaths } from "../compute/advisor.compute.js";
import type { CareerEventSummary } from "@kursa/types";

describe("enrichment.rules", () => {
  it("extracts leadership theme from text", () => {
    const themes = extractThemes("Led the team through a difficult migration");
    assert.ok(themes.includes("leadership"));
  });

  it("matches milestones by keywords", () => {
    const milestones = [
      {
        order: 1,
        title: "Staff Engineer promotion",
        description: "Lead cross-team initiatives and mentor engineers",
        estimatedMonthsFromNow: 12,
        salaryBand: { min: 150000, max: 200000, currency: "USD" as const },
        requiredSkills: ["leadership", "system design"],
        status: "not_started" as const,
      },
    ];
    const matched = matchMilestonesByKeywords(
      "Mentored three engineers and led cross-team system design review",
      milestones,
    );
    assert.ok(matched.includes(1));
  });

  it("builds enrichment with skill names from profile", () => {
    const enrichment = buildRuleEnrichment(
      "Shipped React dashboard using TypeScript",
      ["React", "TypeScript", "Python"],
      [],
      [],
    );
    assert.ok(enrichment.extractedSkillNames.includes("React"));
    assert.ok(enrichment.extractedSkillNames.includes("TypeScript"));
    assert.equal(enrichment.method, "rules");
  });

  it("estimates positive sentiment", () => {
    assert.ok(estimateSentiment("Great success delivering the project") > 0);
  });
});

describe("advisor.compute", () => {
  it("detects material change from wins", () => {
    const signals = {
      winsThisQuarter: 4,
      sentimentTrend12w: 0.1,
      intentionActionGap: false,
    } as Parameters<typeof shouldRegeneratePaths>[0];
    assert.equal(shouldRegeneratePaths(signals), true);
  });

  it("computes journal activity score", () => {
    const events: CareerEventSummary[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      type: "win",
      source: "user",
      body: "test",
      structured: {},
      sentiment: null,
      linkedSkillIds: [],
      linkedPathId: null,
      linkedWorkHistoryId: null,
      enrichment: null,
      occurredAt: new Date().toISOString(),
    }));
    assert.equal(computeJournalActivityScore(events), 50);
  });
});
