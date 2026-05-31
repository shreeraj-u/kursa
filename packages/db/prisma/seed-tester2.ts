/**
 * Seeds tester2@gmail.com with data a real user would enter:
 * onboarding profile, resume-derived skills, journal wins/check-ins/notes/feedback.
 *
 * Does NOT seed: Aria observations, user memories, or career paths (those come from the live pipeline).
 *
 * Run: cd packages/db && pnpm seed:tester2
 * Then: cd apps/server && npx tsx --env-file=.env scripts/bootstrap-tester2-real-run.ts
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

import prisma from "../src/index.js";

const scryptAsync = promisify(scrypt);

const TEST_USER = {
  id: "vtcP1lykashpapNolH1gqxsr4t8iEQCu",
  name: "Jordan Lee",
  email: "tester2@gmail.com",
  password: "password",
} as const;

function daysAgo(days: number, hour = 10) {
  const d = new Date(Date.now() - days * 86400000);
  d.setHours(hour, 30, 0, 0);
  return d;
}

function weeksAgo(weeks: number) {
  return daysAgo(weeks * 7);
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  })) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

async function main() {
  console.log("Seeding tester2@gmail.com (user-entered data only)…");

  const password = await hashPassword(TEST_USER.password);

  await prisma.persistedObservation.deleteMany({ where: { userId: TEST_USER.id } });
  await prisma.careerEvent.deleteMany({ where: { userId: TEST_USER.id } });
  await prisma.userMemory.deleteMany({ where: { userId: TEST_USER.id } });
  await prisma.jobApplication.deleteMany({ where: { profile: { userId: TEST_USER.id } } });
  await prisma.careerPath.deleteMany({ where: { profile: { userId: TEST_USER.id } } });
  await prisma.profile.deleteMany({ where: { userId: TEST_USER.id } });

  const user = await prisma.user.upsert({
    where: { id: TEST_USER.id },
    update: {
      name: TEST_USER.name,
      email: TEST_USER.email,
      emailVerified: true,
    },
    create: {
      id: TEST_USER.id,
      name: TEST_USER.name,
      email: TEST_USER.email,
      emailVerified: true,
    },
  });

  await prisma.account.upsert({
    where: { id: "yL1FiRQ9EQuV2vnBnQeqMSBdBTzQPTVK" },
    update: { password },
    create: {
      id: `${TEST_USER.id}-credential`,
      accountId: TEST_USER.id,
      providerId: "credential",
      userId: TEST_USER.id,
      password,
    },
  });

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      location: "Austin, TX",
      bio: "Full-stack engineer with 5 years building B2B SaaS. Currently leading a small platform team, pivoting toward AI-native product work.",
      targetRole: "Staff AI Engineer",
      yearsOfExperience: 5,
      onboardingDone: true,
      aspirations: {
        targetRoles: ["Staff AI Engineer", "AI Platform Lead"],
        targetIndustries: ["developer tools", "AI infrastructure"],
        horizon3y: "Own the AI platform layer at a Series B+ company",
        horizon5y: "Lead applied AI engineering org of 8–12",
        definitionOfSuccess: "Ship AI features users trust, not just demo well",
      },
      values: {
        workEnvironment: "hybrid",
        riskAppetite: "high_growth",
        salaryExpectation: "$180k–$220k",
        workingStyle: "deep work mornings, collaborative afternoons",
        constraints: "no relocation, remote-friendly",
        imports: {
          resumeFileName: "jordan_lee_resume.pdf",
          linkedinProfileUrl: "https://linkedin.com/in/jordanlee-dev",
        },
      },
      skills: {
        create: [
          { name: "TypeScript", category: "technical", proficiencyLevel: "expert", confidenceRating: 5, lastUsedDate: daysAgo(3), source: "self_reported" },
          { name: "React", category: "technical", proficiencyLevel: "advanced", confidenceRating: 5, lastUsedDate: daysAgo(5), source: "self_reported" },
          { name: "Node.js", category: "technical", proficiencyLevel: "advanced", confidenceRating: 4, lastUsedDate: daysAgo(8), source: "resume" },
          { name: "PostgreSQL", category: "technical", proficiencyLevel: "advanced", confidenceRating: 4, lastUsedDate: daysAgo(12), source: "resume" },
          { name: "OpenAI API", category: "tool", proficiencyLevel: "intermediate", confidenceRating: 3, lastUsedDate: daysAgo(14), source: "self_reported" },
          { name: "Python", category: "technical", proficiencyLevel: "intermediate", confidenceRating: 3, lastUsedDate: daysAgo(90), source: "resume" },
          { name: "Kubernetes", category: "tool", proficiencyLevel: "intermediate", confidenceRating: 3, lastUsedDate: daysAgo(200), source: "resume" },
          { name: "System design", category: "technical", proficiencyLevel: "intermediate", confidenceRating: 3, lastUsedDate: daysAgo(45), source: "self_reported" },
        ],
      },
      workHistories: {
        create: [
          {
            companyName: "LatticeFlow",
            roleTitle: "Software Engineer",
            startDate: new Date("2020-06-01"),
            endDate: new Date("2022-08-31"),
            isCurrent: false,
            outcomes: { highlights: ["Built billing microservice handling $2M ARR", "Cut API p99 latency 40%"] },
          },
          {
            companyName: "Meridian SaaS",
            roleTitle: "Senior Platform Engineer",
            startDate: new Date("2022-09-01"),
            isCurrent: true,
            outcomes: { highlights: ["Led migration to event-driven architecture", "Mentored 2 junior engineers", "Prototyped LLM-assisted support triage"] },
          },
        ],
      },
      educations: {
        create: [
          { type: "degree", credentialName: "B.S. Computer Science", issuer: "UT Austin", completionDate: new Date("2020-05-01") },
          { type: "course", credentialName: "LLM Engineering", issuer: "DeepLearning.AI", completionDate: daysAgo(60) },
        ],
      },
      languages: { create: [{ name: "English", proficiency: "Native" }] },
      socialLinks: {
        create: [
          { platform: "github", url: "https://github.com/jordanlee-dev" },
          { platform: "linkedin", url: "https://linkedin.com/in/jordanlee-dev" },
        ],
      },
      learningGoals: {
        create: [
          { skillName: "RAG pipelines", targetProficiency: "intermediate", status: "LEARNING", deadline: daysAgo(10) },
          { skillName: "LLM evaluation", targetProficiency: "advanced", status: "PLANNED", deadline: daysAgo(30) },
          { skillName: "System design", targetProficiency: "advanced", status: "LEARNING", deadline: daysAgo(5) },
        ],
      },
      constraints: {
        create: [
          { type: "remote_preference", value: "hybrid_or_remote" },
          { type: "no_relocation", value: "true" },
        ],
      },
    },
  });

  await prisma.jobApplication.createMany({
    data: [
      {
        profileId: profile.id,
        company: "Anthropic",
        roleTitle: "Platform Engineer",
        stage: "applied",
        status: "active",
        fitScore: 78,
        appliedAt: daysAgo(18),
      },
      {
        profileId: profile.id,
        company: "Vercel",
        roleTitle: "AI Infrastructure Engineer",
        stage: "phone_screen",
        status: "active",
        fitScore: 85,
        appliedAt: daysAgo(9),
      },
    ],
  });

  const events: Array<{
    type: "checkin_weekly" | "win" | "note" | "feedback" | "onboarding_complete" | "profile_import";
    source: "user" | "system";
    body: string;
    structured: Record<string, unknown>;
    sentiment?: number;
    occurredAt: Date;
  }> = [
    { type: "onboarding_complete", source: "system", body: "Completed career foundation onboarding", structured: { targetRole: "Staff AI Engineer" }, occurredAt: daysAgo(84) },
    { type: "profile_import", source: "system", body: "Imported resume — 8 skills, 2 roles detected", structured: { resumeFileName: "jordan_lee_resume.pdf", skillsFound: 8 }, occurredAt: daysAgo(84) },
    { type: "checkin_weekly", source: "user", body: "Energy went to debugging prod incidents. Challenge: 4/5. Remember: need better on-call rotation.", structured: { energyFocus: "prod incidents", challengeLevel: 4, rememberThis: "on-call rotation" }, sentiment: -0.2, occurredAt: weeksAgo(11) },
    { type: "win", source: "user", body: "Shipped idempotency layer for webhook processor — zero duplicate charges in staging.", structured: { title: "Webhook idempotency", body: "Shipped idempotency layer for webhook processor", skillNames: ["Node.js", "PostgreSQL"] }, sentiment: 0.7, occurredAt: weeksAgo(10) },
    { type: "note", source: "user", body: "Manager mentioned I should document the LLM triage prototype before Q3 planning.", structured: { body: "Manager mentioned I should document the LLM triage prototype before Q3 planning." }, occurredAt: weeksAgo(9) },
    { type: "checkin_weekly", source: "user", body: "Most energy on LLM triage spike. Challenge: 3/5. Excited but unclear on eval strategy.", structured: { energyFocus: "LLM triage spike", challengeLevel: 3 }, sentiment: 0.3, occurredAt: weeksAgo(8) },
    { type: "win", source: "user", body: "LLM triage prototype reduced support ticket classification time by 35% in pilot.", structured: { title: "LLM support triage pilot", body: "35% faster ticket classification in pilot", skillNames: ["OpenAI API"] }, sentiment: 0.8, occurredAt: weeksAgo(7) },
    { type: "feedback", source: "user", body: "Peer review: 'Strongest when connecting infra work to user outcomes.'", structured: { body: "Strongest when connecting infra work to user outcomes", fromRole: "peer" }, occurredAt: weeksAgo(6) },
    { type: "checkin_weekly", source: "user", body: "Energy split between interviews and sprint work. Challenge: 4/5. Feeling stretched.", structured: { energyFocus: "interviews + sprint", challengeLevel: 4 }, sentiment: -0.1, occurredAt: weeksAgo(5) },
    { type: "win", source: "user", body: "Passed Vercel phone screen — moving to system design round.", structured: { title: "Vercel phone screen", body: "Advanced to system design round", skillNames: ["System design"] }, sentiment: 0.6, occurredAt: weeksAgo(4) },
    { type: "note", source: "user", body: "RAG course module 3 done. Need to apply chunking strategy to our internal docs search.", structured: { body: "RAG course module 3 done" }, occurredAt: weeksAgo(3) },
    { type: "checkin_weekly", source: "user", body: "Deep work blocked by meetings Tue/Thu. Challenge: 3/5.", structured: { energyFocus: "meetings blocking deep work", challengeLevel: 3 }, sentiment: 0.1, occurredAt: weeksAgo(2) },
    { type: "win", source: "user", body: "Presented platform roadmap to eng leadership — green-lit Q3 AI infra budget.", structured: { title: "Platform roadmap approval", body: "Q3 AI infra budget approved", skillNames: ["Team leadership"] }, sentiment: 0.75, occurredAt: weeksAgo(1) },
    { type: "checkin_weekly", source: "user", body: "Energy on eval harness design. Challenge: 2/5. Momentum feels good.", structured: { energyFocus: "eval harness design", challengeLevel: 2, rememberThis: "schedule Vercel onsite prep" }, sentiment: 0.5, occurredAt: daysAgo(2) },
    { type: "note", source: "user", body: "Three weeks mentioning meeting load in check-ins — pattern worth addressing with manager.", structured: { body: "Meeting load pattern" }, occurredAt: daysAgo(1) },
  ];

  await prisma.careerEvent.createMany({
    data: events.map((e) => ({
      userId: TEST_USER.id,
      profileId: profile.id,
      type: e.type,
      source: e.source,
      body: e.body,
      structured: e.structured as never,
      sentiment: e.sentiment ?? null,
      occurredAt: e.occurredAt,
    })),
  });

  console.log("\n✅ User data seed complete (no Aria observations, memories, or paths)");
  console.log(`   Email:    ${TEST_USER.email}`);
  console.log(`   Password: ${TEST_USER.password}`);
  console.log(`   Profile:  ${profile.id}`);
  console.log(`   Events:   ${events.length} (wins, check-ins, notes, onboarding)`);
  console.log("\n   Next: cd apps/server && npx tsx --env-file=.env scripts/bootstrap-tester2-real-run.ts");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
