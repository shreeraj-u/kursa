import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildRuleEnrichment,
  extractThemes,
  matchMilestonesByKeywords,
  estimateSentiment,
} from "../compute/enrichment.rules.js";
import { computeJournalActivityScore, shouldRegeneratePaths } from "../compute/advisor.compute.js";
import type { CareerEventSummary, ProfileUpdateDelta } from "@kursa/types";
import type { CareerEventSource, CareerEventType } from "@kursa/db";
import {
  createCareerEventIntelligence,
  getAdvisorEventWindowStart,
  selectAdvisorSignalEvents,
} from "../services/career-event-intelligence/core.js";

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


describe("career-event-intelligence", () => {
  function makeHarness() {
    const calls = {
      resolvedLinks: [] as Array<{ type: CareerEventType; explicitSkillNames?: string[] }>,
      created: [] as Array<{ type: CareerEventType; source: CareerEventSource; linkedSkillIds: string[] }>,
      deltas: [] as ProfileUpdateDelta[],
      distills: 0,
      enrichments: [] as string[],
    };

    const intelligence = createCareerEventIntelligence({
      async resolveProfile() {
        return { id: "profile-1" };
      },
      async resolveInitialLinks(_profileId, type, _structured, explicitSkillNames) {
        calls.resolvedLinks.push({ type, explicitSkillNames });
        return {
          linkedSkillIds: ["skill-1"],
          linkedPathId: "path-1",
          linkedWorkHistoryId: "work-1",
        };
      },
      async createCareerEvent({ input, links, sentiment }) {
        calls.created.push({
          type: input.type,
          source: input.source,
          linkedSkillIds: input.linkedSkillIds ?? links.linkedSkillIds,
        });
        return {
          id: `event-${calls.created.length}`,
          type: input.type,
          source: input.source,
          body: input.body ?? null,
          structured: input.structured,
          sentiment,
          linkedSkillIds: input.linkedSkillIds ?? links.linkedSkillIds,
          linkedPathId: input.linkedPathId ?? links.linkedPathId,
          linkedWorkHistoryId: input.linkedWorkHistoryId ?? links.linkedWorkHistoryId,
          enrichment: null,
          occurredAt: input.occurredAt ?? new Date("2026-05-31T00:00:00.000Z"),
        };
      },
      async applyProfileDelta(_profileId, delta) {
        calls.deltas.push(delta);
      },
      async runMemoryDistillation() {
        calls.distills += 1;
      },
      scheduleEnrichment(_userId, _profileId, eventId) {
        calls.enrichments.push(eventId);
      },
    });

    return { calls, intelligence };
  }

  it("ingests user wins with profile delta and enrichment scheduling", async () => {
    const { calls, intelligence } = makeHarness();

    const event = await intelligence.ingestEvent("user-1", {
      type: "win",
      source: "user",
      body: "Shipped the launch with TypeScript",
      structured: { title: "Launch", body: "Shipped", skillNames: ["TypeScript"] },
    });

    assert.equal(event.type, "win");
    assert.deepEqual(event.linkedSkillIds, ["skill-1"]);
    assert.deepEqual(calls.resolvedLinks[0], { type: "win", explicitSkillNames: ["TypeScript"] });
    assert.equal(calls.deltas.length, 1);
    assert.equal(calls.deltas[0]!.newAchievements?.[0]?.title, "Launch");
    assert.deepEqual(calls.enrichments, ["event-1"]);
    assert.equal(calls.distills, 1);
  });

  it("keeps notes out of profile delta while still allowing enrichment", async () => {
    const { calls, intelligence } = makeHarness();

    await intelligence.ingestEvent("user-1", {
      type: "note",
      source: "user",
      body: "Reflection",
      structured: { body: "Reflection", mood: 4 },
      skipDelta: true,
    });

    assert.equal(calls.deltas.length, 0);
    assert.deepEqual(calls.enrichments, ["event-1"]);
  });

  it("does not schedule user enrichment for system or Aria events", async () => {
    const { calls, intelligence } = makeHarness();

    await intelligence.ingestEvent("user-1", {
      type: "system",
      source: "system",
      body: "Nudge delivered",
      structured: {},
      skipDelta: true,
      skipDistill: true,
    });
    await intelligence.ingestEvent("user-1", {
      type: "aria_observation",
      source: "aria",
      body: "Observation",
      structured: { text: "Observation" },
      skipDelta: true,
      skipDistill: true,
    });

    assert.equal(calls.resolvedLinks.length, 0);
    assert.deepEqual(calls.enrichments, []);
  });

  it("uses a 28 day advisor window for recent activity and 84 days after inactivity", () => {
    const now = new Date("2026-05-31T00:00:00.000Z");

    assert.equal(
      getAdvisorEventWindowStart(new Date("2026-05-25T00:00:00.000Z"), now).toISOString(),
      "2026-05-03T00:00:00.000Z",
    );
    assert.equal(
      getAdvisorEventWindowStart(new Date("2026-05-01T00:00:00.000Z"), now).toISOString(),
      "2026-03-08T00:00:00.000Z",
    );
  });

  it("excludes Aria observation events from advisor context signals and cache inputs", () => {
    const events = [
      { id: "user-win", type: "win" as const, source: "user" as const },
      { id: "aria-observation", type: "aria_observation" as const, source: "aria" as const },
    ];

    assert.deepEqual(selectAdvisorSignalEvents(events).map((e) => e.id), ["user-win"]);
  });
});
