import { randomUUID } from "node:crypto";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../prisma/generated/client";

type TestPayload = {
  basics: {
    targetRole: string;
    location: string;
    yearsOfExperience: number;
    bio: string;
  };
  skills: Array<{
    name: string;
    category: "technical" | "soft" | "tool";
    confidenceRating: number;
  }>;
  workHistory: Array<{
    companyName: string;
    roleTitle: string;
    outcomes: string;
  }>;
  values: {
    workEnvironment: "startup" | "corporate" | "remote" | "hybrid";
    riskAppetite: "stability_seeking" | "balanced" | "high_growth";
    salaryExpectation: string;
    workingStyle: string;
    constraints: string;
  };
  aspirations: {
    targetRoles: string;
    targetIndustries: string;
    horizon3y: string;
    horizon5y: string;
    definitionOfSuccess: string;
  };
  imports: {
    resumeFileName: string;
    resumeRawText: string;
    linkedinProfileUrl: string;
  };
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to run this test.");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const TEST_USER_EMAIL = `kursa-onboarding-test+${randomUUID()}@example.com`;
const TEST_USER_ID = `test-${randomUUID()}`;

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  fail  ${name}`);
    console.error(`        ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function saveOnboardingForUser(userId: string, payload: TestPayload) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        targetRole: payload.basics.targetRole,
        location: payload.basics.location,
        yearsOfExperience: payload.basics.yearsOfExperience,
        bio: payload.basics.bio,
        values: {
          layer1Values: payload.values,
          imports: payload.imports,
        } as never,
        aspirations: payload.aspirations as never,
        onboardingDone: true,
      },
    });

    await tx.skill.deleteMany({ where: { profileId: profile.id } });
    const seenSkills = new Set<string>();
    const dedupedSkills = payload.skills.filter((skill) => {
      const key = skill.name.toLowerCase();
      if (seenSkills.has(key)) {
        return false;
      }
      seenSkills.add(key);
      return true;
    });
    if (dedupedSkills.length > 0) {
      await tx.skill.createMany({
        data: dedupedSkills.map((skill) => ({
          profileId: profile.id,
          name: skill.name,
          category: skill.category,
          confidenceRating: skill.confidenceRating,
        })),
        skipDuplicates: true,
      });
    }

    await tx.workHistory.deleteMany({ where: { profileId: profile.id } });
    for (const item of payload.workHistory) {
      await tx.workHistory.create({
        data: {
          profileId: profile.id,
          companyName: item.companyName,
          roleTitle: item.roleTitle,
          startDate: new Date(),
          isCurrent: false,
          outcomes: { text: item.outcomes } as never,
        },
      });
    }
  });

  return profile.id;
}

const validPayload: TestPayload = {
  basics: {
    targetRole: "Senior Backend Engineer",
    location: "Remote",
    yearsOfExperience: 7,
    bio: "Backend engineer specializing in distributed systems.",
  },
  skills: [
    { name: "TypeScript", category: "technical", confidenceRating: 5 },
    { name: "Go", category: "technical", confidenceRating: 4 },
    { name: "PostgreSQL", category: "technical", confidenceRating: 5 },
    { name: "Docker", category: "tool", confidenceRating: 4 },
    // Duplicate to verify dedupe in DB layer:
    { name: "typescript", category: "technical", confidenceRating: 5 },
  ],
  workHistory: [
    {
      companyName: "Acme",
      roleTitle: "Senior Engineer",
      outcomes: "Led migration to event-driven architecture.",
    },
    {
      companyName: "Globex",
      roleTitle: "Backend Engineer",
      outcomes: "Built billing pipeline.",
    },
  ],
  values: {
    workEnvironment: "remote",
    riskAppetite: "balanced",
    salaryExpectation: "USD 180k",
    workingStyle: "Async-first.",
    constraints: "Remote only.",
  },
  aspirations: {
    targetRoles: "Principal engineer",
    targetIndustries: "Developer tools",
    horizon3y: "Tech lead for a platform team",
    horizon5y: "Principal engineer or founding engineer",
    definitionOfSuccess: "Building durable systems",
  },
  imports: {
    resumeFileName: "",
    resumeRawText: "",
    linkedinProfileUrl: "",
  },
};

async function main() {
  // Seed test user
  await prisma.user.create({
    data: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      name: "Kursa Onboarding Test",
      emailVerified: false,
    },
  });

  try {
    await runTest("creates profile + skills + work history in single transaction", async () => {
      await saveOnboardingForUser(TEST_USER_ID, validPayload);

      const profile = await prisma.profile.findUniqueOrThrow({
        where: { userId: TEST_USER_ID },
      });
      assert(profile.onboardingDone === true, "expected onboardingDone=true");
      assert(profile.targetRole === validPayload.basics.targetRole, "targetRole mismatch");
      assert(profile.yearsOfExperience === validPayload.basics.yearsOfExperience, "years mismatch");

      const skills = await prisma.skill.findMany({ where: { profileId: profile.id } });
      // We send 5 skills with one duplicate (typescript vs TypeScript) → expect 4 unique stored
      assert(
        skills.length === 4,
        `expected 4 deduped skills, got ${skills.length}: ${skills.map((s) => s.name).join(", ")}`,
      );

      const tsSkill = skills.find((s) => s.name === "TypeScript");
      assert(tsSkill !== undefined, "expected TypeScript skill to persist");
      assert(
        tsSkill?.confidenceRating === 5,
        `expected confidenceRating 5 to persist, got ${tsSkill?.confidenceRating}`,
      );
      assert(tsSkill?.category === "technical", `expected category technical, got ${tsSkill?.category}`);

      const work = await prisma.workHistory.findMany({ where: { profileId: profile.id } });
      const acme = work.find((w) => w.companyName === "Acme");
      assert(
        (acme?.outcomes as { text?: string } | null)?.text === "Led migration to event-driven architecture.",
        "expected work outcomes JSON to persist",
      );
      assert(work.length === 2, `expected 2 work entries, got ${work.length}`);
      assert(work[0]?.startDate instanceof Date, "expected startDate to be a Date");
    });

    await runTest("re-saving wipes prior skills/work history (idempotent)", async () => {
      const reducedPayload: TestPayload = {
        ...validPayload,
        skills: [{ name: "Python", category: "technical", confidenceRating: 5 }],
        workHistory: [
          {
            companyName: "Initech",
            roleTitle: "Engineering Lead",
            outcomes: "Led the platform team.",
          },
        ],
      };

      await saveOnboardingForUser(TEST_USER_ID, reducedPayload);

      const profile = await prisma.profile.findUniqueOrThrow({
        where: { userId: TEST_USER_ID },
      });
      const skills = await prisma.skill.findMany({ where: { profileId: profile.id } });
      const work = await prisma.workHistory.findMany({ where: { profileId: profile.id } });

      assert(skills.length === 1, `expected 1 skill after re-save, got ${skills.length}`);
      assert(skills[0].name === "Python", `expected only Python, got ${skills[0].name}`);
      assert(work.length === 1, `expected 1 work entry, got ${work.length}`);
      assert(work[0].companyName === "Initech", `expected Initech, got ${work[0].companyName}`);
    });

    await runTest("values + aspirations + imports persist in JSON columns", async () => {
      const profile = await prisma.profile.findUniqueOrThrow({
        where: { userId: TEST_USER_ID },
      });
      const values = profile.values as Record<string, unknown> | null;
      const aspirations = profile.aspirations as Record<string, unknown> | null;

      assert(values && typeof values === "object", "expected values to be an object");
      assert(
        (values?.layer1Values as Record<string, unknown>)?.workEnvironment === "remote",
        "values.layer1Values.workEnvironment mismatch",
      );
      assert(
        aspirations && typeof aspirations === "object",
        "expected aspirations to be an object",
      );
      assert(
        (aspirations as Record<string, unknown>)?.targetRoles === "Principal engineer",
        "aspirations.targetRoles mismatch",
      );
    });

    await runTest("cascade delete cleans skills + work history when user is removed", async () => {
      await prisma.user.delete({ where: { id: TEST_USER_ID } });
      const profile = await prisma.profile.findUnique({
        where: { userId: TEST_USER_ID },
      });
      assert(profile === null, "expected cascade to remove profile");
      const skills = await prisma.skill.findMany({
        where: { profile: { userId: TEST_USER_ID } },
      });
      assert(skills.length === 0, "expected cascade to remove skills");
    });
  } finally {
    // Always attempt cleanup. If the cascade test deleted the user, this is a no-op.
    try {
      await prisma.user.delete({ where: { id: TEST_USER_ID } });
    } catch {
      // ignore
    }
    await prisma.$disconnect();
  }

  console.log("");
  console.log(`Passed: ${passed} / ${passed + failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Fatal error in test runner:");
  console.error(error);
  process.exitCode = 1;
});
