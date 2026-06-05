import { sanitizeReviewProposedValue } from "../src/lib/onboarding-review.js";
import type { OnboardingPayload } from "@kursa/types";

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

const payload: OnboardingPayload = {
  basics: {
    targetRole: "Senior Frontend Engineer",
    location: "Singapore",
    yearsOfExperience: 5,
    bio: "frontend engineer focused on react and design systems",
  },
  skills: [{ name: "React", category: "technical", confidenceRating: 5 }],
  workHistory: [
    {
      companyName: "Acme",
      roleTitle: "Frontend Engineer",
      outcomes: "built dashboards",
      startDate: "2020",
      endDate: null,
      isCurrent: true,
    },
  ],
  education: [],
  languages: [],
  socialLinks: [],
  projects: [],
  achievements: [],
  values: {
    workEnvironment: "startup",
    riskAppetite: "balanced",
    salaryExpectation: "USD 150k",
    workingStyle: "async and focused",
    constraints: "None",
  },
  aspirations: {
    targetRoles: "Staff engineer",
    targetIndustries: "Developer tools",
    horizon3y: "lead a team",
    horizon5y: "build products",
    definitionOfSuccess: "useful work",
  },
  imports: {
    linkedinProfileUrl: "",
    resumeFileName: "",
    resumeRawText: "",
  },
};

const tests: TestCase[] = [
  {
    name: "accepts and trims safe proposed values for approved paths",
    run: () => {
      const value = sanitizeReviewProposedValue(payload, "basics.bio", "  Frontend engineer focused on React and design systems.  ");
      assert(value === "Frontend engineer focused on React and design systems.", `unexpected value: ${String(value)}`);
    },
  },
  {
    name: "rejects proposed values for unapproved paths",
    run: () => {
      const value = sanitizeReviewProposedValue(payload, "rawResumeText", "secret");
      assert(value === undefined, "expected rejected value");
    },
  },
  {
    name: "rejects proposed values that would invalidate the payload",
    run: () => {
      const value = sanitizeReviewProposedValue(payload, "workHistory.0.startDate", "soon");
      assert(value === undefined, "expected invalid year to be rejected");
    },
  },
  {
    name: "rejects proposed values for missing array entries",
    run: () => {
      const value = sanitizeReviewProposedValue(payload, "workHistory.9.outcomes", "Polished outcome.");
      assert(value === undefined, "expected missing array entry to be rejected");
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
