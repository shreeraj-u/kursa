import { onboardingPayloadSchema, onboardingReviewIssueSchema } from "@kursa/types";

type TestCase = {
  name: string;
  run: () => void;
};

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const validPayload = {
  basics: {
    targetRole: "Senior Frontend Engineer",
    location: "Singapore",
    yearsOfExperience: 5,
    bio: "Frontend engineer focused on design systems, developer tooling, and high-quality product delivery.",
  },
  skills: [
    { name: "TypeScript", category: "technical" as const, confidenceRating: 5 },
    { name: "React", category: "technical" as const, confidenceRating: 5 },
    { name: "Figma", category: "tool" as const, confidenceRating: 3 },
  ],
  workHistory: [
    {
      companyName: "Stripe",
      roleTitle: "Frontend Engineer",
      outcomes: "Owned billing dashboard performance work and collaborated with design and platform teams.",
      startDate: "2020",
      endDate: "2024",
      isCurrent: false,
    },
  ],
  values: {
    workEnvironment: "startup" as const,
    riskAppetite: "balanced" as const,
    salaryExpectation: "USD 160-200k",
    workingStyle: "Async-first, deep focus mornings.",
    constraints: "Remote only.",
  },
  aspirations: {
    targetRoles: "Staff engineer, founding engineer",
    targetIndustries: "Developer tools, AI",
    horizon3y: "Lead a small frontend platform team.",
    horizon5y: "Found a developer-facing product.",
    definitionOfSuccess: "Ship things people use daily.",
  },
  socialLinks: [{ platform: "github", url: "https://github.com/example" }],
  imports: {
    linkedinProfileUrl: "",
  },
};

const tests: TestCase[] = [
  {
    name: "accepts a complete valid payload",
    run: () => {
      const result = onboardingPayloadSchema.safeParse(validPayload);
      assert(result.success, `expected success, got: ${result.success ? "ok" : JSON.stringify(result.error?.issues)}`);
    },
  },
  {
    name: "rejects missing basics.targetRole",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        basics: { ...validPayload.basics, targetRole: "" },
      });
      assert(!result.success, "expected failure for empty targetRole");
    },
  },
  {
    name: "rejects overlong free-text fields",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        basics: { ...validPayload.basics, bio: "x".repeat(1_001) },
      });
      assert(!result.success, "expected failure for overlong bio");
    },
  },
  {
    name: "rejects empty skills array",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({ ...validPayload, skills: [] });
      assert(!result.success, "expected failure for empty skills");
    },
  },
  {
    name: "rejects empty work history",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({ ...validPayload, workHistory: [] });
      assert(!result.success, "expected failure for empty work history");
    },
  },
  {
    name: "rejects missing work-history start year",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        workHistory: [{ ...validPayload.workHistory[0], startDate: null }],
      });
      assert(!result.success, "expected failure for missing start year");
    },
  },
  {
    name: "rejects invalid work-history date range",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        workHistory: [{ ...validPayload.workHistory[0], startDate: "2024", endDate: "2020" }],
      });
      assert(!result.success, "expected failure for end year before start year");
    },
  },
  {
    name: "rejects invalid social URL",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        socialLinks: [{ platform: "github", url: "not-a-url" }],
      });
      assert(!result.success, "expected failure for invalid social URL");
    },
  },
  {
    name: "rejects invalid project URL",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        projects: [{ title: "Kursa", description: null, url: "github.com/example", outcomes: "", startDate: null, endDate: null }],
      });
      assert(!result.success, "expected failure for invalid project URL");
    },
  },
  {
    name: "rejects out-of-range yearsOfExperience",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        basics: { ...validPayload.basics, yearsOfExperience: -1 },
      });
      assert(!result.success, "expected failure for negative years");
    },
  },
  {
    name: "rejects invalid skill category",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        skills: [
          { name: "TypeScript", category: "magic" as never, confidenceRating: 5 },
        ],
      });
      assert(!result.success, "expected failure for invalid skill category");
    },
  },
  {
    name: "allows constraints to default when empty",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        values: { ...validPayload.values, constraints: "" },
      });
      assert(result.success, "expected success even with empty constraints");
    },
  },
  {
    name: "imports field is optional and defaults",
    run: () => {
      const { imports: _omit, ...partial } = validPayload;
      const result = onboardingPayloadSchema.safeParse(partial);
      assert(result.success, "expected success without imports");
      if (result.success) {
        assert(result.data.imports.linkedinProfileUrl === "", "imports should default");
      }
    },
  },
  {
    name: "review proposed values are only allowed on approved paths",
    run: () => {
      const result = onboardingReviewIssueSchema.safeParse({
        id: "bad-path",
        severity: "suggestion",
        category: "quality",
        path: "rawResumeText",
        message: "Do not allow this.",
        proposedValue: "secret",
      });
      assert(!result.success, "expected invalid proposedValue path");
    },
  },
];

for (const test of tests) {
  try {
    test.run();
    passed += 1;
    console.log(`  ok  ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`  fail  ${test.name}`);
    console.error(`        ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log("");
console.log(`Passed: ${passed} / ${passed + failed}`);
if (failed > 0) {
  process.exitCode = 1;
}
