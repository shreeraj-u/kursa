import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildIntakeSummary,
  inferJourneyPreferences,
  type IntakeProfile,
} from "./journey-intake.service.js";

function baseProfile(overrides: Partial<IntakeProfile> = {}): IntakeProfile {
  return {
    id: "profile-1",
    bio: "Backend engineer",
    targetRole: "Staff Engineer",
    location: "Remote",
    yearsOfExperience: 8,
    careerTrajectory: "accelerating",
    values: {
      workEnvironment: "remote",
      riskAppetite: "high_growth",
      minSalary: 180000,
    },
    aspirations: {
      targetRoles: ["Staff Engineer"],
      targetIndustries: ["fintech"],
      horizon3y: "Lead platform architecture",
      definitionOfSuccess: "Own technical direction",
    },
    onboardingDone: true,
    skills: [
      { name: "TypeScript", confidenceRating: 0.9, source: "resume" },
      { name: "PostgreSQL", confidenceRating: 0.8, source: "resume" },
    ],
    workHistories: [
      { roleTitle: "Senior Engineer", companyName: "Acme", isCurrent: true, outcomes: null },
    ],
    socialLinks: [{ platform: "github" }],
    ...overrides,
  };
}

describe("inferJourneyPreferences", () => {
  it("infers direction from target role and aspirations for resume-heavy profiles", () => {
    const prefs = inferJourneyPreferences(baseProfile());
    assert.equal(prefs.preferredDirection, "Staff Engineer");
    assert.ok(prefs.leanToward.includes("fintech"));
    assert.equal(prefs.growthPace, "accelerated");
    assert.ok(prefs.priorities.includes("remote"));
    assert.ok(prefs.priorities.includes("salary"));
  });

  it("returns exploratory pace for sparse pivot profiles", () => {
    const prefs = inferJourneyPreferences(
      baseProfile({
        targetRole: null,
        aspirations: { horizon3y: "Pivot into climate tech product" },
        careerTrajectory: "stagnating",
        values: { riskAppetite: "balanced" },
        skills: [],
        workHistories: [],
      }),
    );
    assert.equal(prefs.growthPace, "exploratory");
    assert.ok(prefs.preferredDirection.includes("Pivot"));
  });

  it("maps leadership aspirations to leadership priority", () => {
    const prefs = inferJourneyPreferences(
      baseProfile({
        aspirations: {
          horizon3y: "Become an engineering manager",
          definitionOfSuccess: "Lead a team of 8",
        },
      }),
    );
    assert.ok(prefs.priorities.includes("leadership"));
  });
});

describe("buildIntakeSummary", () => {
  it("includes resume and onboarding sources when profile is rich", () => {
    const summary = buildIntakeSummary(baseProfile(), null);
    assert.equal(summary.currentRole, "Senior Engineer");
    assert.equal(summary.targetRole, "Staff Engineer");
    assert.ok(summary.topSkills.includes("TypeScript"));
    assert.ok(summary.sources.includes("resume"));
    assert.ok(summary.sources.includes("onboarding"));
    assert.ok(summary.sources.includes("github"));
  });
});
