import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeSkillsProfileCompleteness,
  extractMarketSkillsFromTitles,
  extractMilestoneSkills,
  mergeSkillRecommendations,
  parsePathSkillGaps,
} from "./skills-intelligence.compute.js";

describe("skills-intelligence.compute", () => {
  it("extracts market skills from job titles", () => {
    const skills = extractMarketSkillsFromTitles([
      "Senior JavaScript Engineer",
      "Backend Engineer (Node.js, PostgreSQL)",
      "Staff React / TypeScript Engineer",
    ]);

    const names = skills.map((s) => s.skill.toLowerCase());
    assert.ok(names.includes("javascript"));
    assert.ok(names.includes("node.js") || names.includes("nodejs"));
    assert.ok(names.includes("typescript"));
  });

  it("merges recommendations by highest priority per skill", () => {
    const merged = mergeSkillRecommendations([
      {
        skillName: "JavaScript",
        reason: "Path gap",
        priority: 70,
        source: "path",
        cta: "add_skill",
      },
      {
        skillName: "javascript",
        reason: "Market demand",
        priority: 90,
        source: "market",
        cta: "add_skill",
      },
    ]);

    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.priority, 90);
    assert.equal(merged[0]?.source, "market");
  });

  it("computes profile completeness with and without target role", () => {
    assert.ok(computeSkillsProfileCompleteness(2, false) < computeSkillsProfileCompleteness(8, true));
  });

  it("parses path skill gaps from objects and strings", () => {
    const gaps = parsePathSkillGaps([
      { skill: "TypeScript", whyItMatters: "Core for your target role", priority: "high" },
      "GraphQL",
      { skill: "Profile depth", whyItMatters: "meta", priority: "high" },
    ]);

    assert.equal(gaps.length, 2);
    assert.equal(gaps[0]?.skill, "TypeScript");
    assert.equal(gaps[1]?.skill, "GraphQL");
  });

  it("extracts required skills from incomplete milestones", () => {
    const skills = extractMilestoneSkills([
      {
        order: 1,
        title: "Staff",
        description: "",
        estimatedMonthsFromNow: 6,
        salaryBand: { min: 0, max: 0, currency: "USD" },
        requiredSkills: ["System Design", "Mentoring"],
        status: "not_started",
      },
      {
        order: 2,
        title: "Done",
        description: "",
        estimatedMonthsFromNow: 12,
        salaryBand: { min: 0, max: 0, currency: "USD" },
        requiredSkills: ["Legacy"],
        status: "completed",
      },
    ]);

    assert.deepEqual(skills, ["System Design", "Mentoring"]);
  });
});
