import { onboardingPayloadSchema } from "../src/app/onboarding/schema";
import { parseResumeText } from "../src/app/onboarding/imports/resume";

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
    bio: "Building products developers love.",
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
      outcomes: "Owned billing dashboard performance work.",
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
  imports: {
    resumeFileName: "",
    resumeRawText: "",
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
    name: "allows constraints to default to None when empty",
    run: () => {
      const result = onboardingPayloadSchema.safeParse({
        ...validPayload,
        values: { ...validPayload.values, constraints: "" },
      });
      assert(result.success, "expected success even with empty constraints (defaulted)");
    },
  },
  {
    name: "imports field is optional and defaults",
    run: () => {
      const { imports: _omit, ...partial } = validPayload;
      const result = onboardingPayloadSchema.safeParse(partial);
      assert(result.success, "expected success without imports");
      if (result.success) {
        assert(result.data.imports.resumeFileName === "", "imports should default");
      }
    },
  },
  {
    name: "resume parser identifies known languages",
    run: () => {
      const text = "Built scalable services using TypeScript, Python, and PostgreSQL on AWS.";
      const result = parseResumeText(text);
      const names = result.skills.map((skill) => skill.name);
      assert(names.includes("TypeScript"), `missing TypeScript: ${names.join(", ")}`);
      assert(names.includes("Python"), `missing Python: ${names.join(", ")}`);
      assert(names.includes("PostgreSQL"), `missing PostgreSQL: ${names.join(", ")}`);
      assert(names.includes("AWS"), `missing AWS: ${names.join(", ")}`);
    },
  },
  {
    name: "resume parser does not false-positive on substrings",
    run: () => {
      const text = "Worked across teams to ship key initiatives.";
      const result = parseResumeText(text);
      assert(result.skills.length === 0, `unexpected matches: ${result.skills.map((s) => s.name).join(", ")}`);
    },
  },
  {
    name: "resume parser dedupes case-variant aliases",
    run: () => {
      const text = "React, REACT, react.js everywhere.";
      const result = parseResumeText(text);
      const reactMatches = result.skills.filter((skill) => skill.name === "React");
      assert(reactMatches.length === 1, `expected 1 React match, got ${reactMatches.length}`);
    },
  },
  {
    name: "skills listed in a Skills section get max confidence",
    run: () => {
      const text = [
        "John Doe — Software Engineer",
        "",
        "Skills",
        "TypeScript, React, PostgreSQL, Docker",
        "",
        "Experience",
        "Acme Corp — built internal tools.",
      ].join("\n");
      const result = parseResumeText(text);
      const ts = result.skills.find((skill) => skill.name === "TypeScript");
      assert(ts !== undefined, "expected TypeScript to be detected");
      assert(ts!.inSkillsSection, "expected TypeScript flagged as in skills section");
      assert(ts!.confidenceRating === 5, `expected confidence 5, got ${ts!.confidenceRating}`);
    },
  },
  {
    name: "single incidental mention gets moderate confidence",
    run: () => {
      const text = "In a side project I tried a bit of Rust once.";
      const result = parseResumeText(text);
      const rust = result.skills.find((skill) => skill.name === "Rust");
      assert(rust !== undefined, "expected Rust to be detected");
      assert(!rust!.inSkillsSection, "expected Rust not in a skills section");
      assert(rust!.confidenceRating === 3, `expected confidence 3, got ${rust!.confidenceRating}`);
    },
  },
  {
    name: "repeated mentions increase confidence",
    run: () => {
      const text = "Python data pipelines. Python services. Python everywhere.";
      const result = parseResumeText(text);
      const py = result.skills.find((skill) => skill.name === "Python");
      assert(py !== undefined, "expected Python detected");
      assert(py!.occurrences >= 3, `expected >=3 occurrences, got ${py!.occurrences}`);
      assert(py!.confidenceRating === 5, `expected confidence 5, got ${py!.confidenceRating}`);
    },
  },
  {
    name: "ranking puts skills-section hits first",
    run: () => {
      const text = [
        "Summary",
        "I once touched Kotlin during an internship.",
        "",
        "Technical Skills",
        "Rust, Kubernetes, Terraform",
      ].join("\n");
      const result = parseResumeText(text);
      const names = result.skills.map((skill) => skill.name);
      const kotlinIdx = names.indexOf("Kotlin");
      const rustIdx = names.indexOf("Rust");
      assert(rustIdx !== -1 && kotlinIdx !== -1, `expected Rust and Kotlin detected, got: ${names.join(", ")}`);
      assert(
        rustIdx < kotlinIdx,
        `expected skills-section term ranked above incidental, got: ${names.join(", ")}`,
      );
    },
  },
  {
    name: "extraction is capped at 30 skills",
    run: () => {
      const everySkill =
        "javascript typescript python java c++ c# golang rust php ruby swift kotlin dart scala elixir haskell bash sql html css react next.js vue angular svelte redux tailwind node.js express nestjs fastify django flask fastapi graphql postgres mysql mongodb redis prisma docker kubernetes terraform ansible jenkins aws gcp azure vercel netlify linux git github gitlab jira postman figma";
      const result = parseResumeText(everySkill);
      assert(result.skills.length <= 30, `expected <=30 skills, got ${result.skills.length}`);
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
