import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

import prisma from "../src/index.js";

const scryptAsync = promisify(scrypt);

const TEST_USER = {
  id: "aZxF0RanmdKJew0GYi57N2bxYyijY8l2",
  name: "AI Observation Tester",
  email: "ai.observation@test.kursa.dev",
  password: "KursaAI2026!",
} as const;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
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

function profileData() {
  return {
    location: "Singapore",
    bio: "Product-minded software engineer moving from frontend platform work into AI product engineering. Experienced in building React systems, developer tooling, and cross-functional launches.",
    targetRole: "AI Product Engineer",
    yearsOfExperience: 6,
    aspirations: {
      targetRoles: ["AI Product Engineer", "Applied AI Engineer"],
      targetIndustries: ["AI tools", "developer productivity", "career technology"],
      horizon: "12 months",
      successDefinition:
        "Own an AI-enabled product surface from prototype through measurable adoption.",
      threeYear:
        "Lead a small applied-AI product team building trustworthy workflow automation.",
      fiveYear:
        "Become a product-engineering leader known for shipping useful AI systems.",
    },
    values: {
      workEnvironment: "hybrid",
      riskAppetite: "high_growth",
      teamSizePreference: "small",
      minSalary: 150000,
      maxSalary: 210000,
      currency: "SGD",
      geographicConstraints: ["Singapore", "Remote APAC"],
    },
    onboardingDone: true,
    skills: {
      create: [
        {
          name: "React",
          category: "technical",
          proficiencyLevel: "expert",
          confidenceRating: 5,
          lastUsedDate: daysAgo(25),
        },
        {
          name: "TypeScript",
          category: "technical",
          proficiencyLevel: "advanced",
          confidenceRating: 5,
          lastUsedDate: daysAgo(12),
        },
        {
          name: "OpenAI API",
          category: "tool",
          proficiencyLevel: "intermediate",
          confidenceRating: 3,
          lastUsedDate: daysAgo(18),
        },
        {
          name: "Prompt evaluation",
          category: "technical",
          proficiencyLevel: "beginner",
          confidenceRating: 2,
          lastUsedDate: null,
        },
        {
          name: "GraphQL",
          category: "technical",
          proficiencyLevel: "advanced",
          confidenceRating: 4,
          lastUsedDate: daysAgo(240),
        },
        {
          name: "Kubernetes",
          category: "tool",
          proficiencyLevel: "advanced",
          confidenceRating: 4,
          lastUsedDate: daysAgo(390),
        },
      ],
    },
    learningGoals: {
      create: [
        {
          skillName: "LLM evaluation harnesses",
          targetProficiency: "advanced",
          status: "LEARNING",
          deadline: daysAgo(14),
        },
        {
          skillName: "Retrieval augmented generation",
          targetProficiency: "intermediate",
          status: "PLANNED",
          deadline: daysAgo(45),
        },
        {
          skillName: "AI product analytics",
          targetProficiency: "intermediate",
          status: "LEARNING",
          deadline: daysFromNow(30),
        },
        {
          skillName: "Design partner interviews",
          targetProficiency: "intermediate",
          status: "COMPLETED",
          deadline: daysAgo(20),
        },
      ],
    },
    workHistories: {
      create: [
        {
          companyName: "Orbit UI Labs",
          roleTitle: "Frontend Engineer",
          startDate: new Date("2019-04-01"),
          endDate: new Date("2021-06-30"),
          isCurrent: false,
          outcomes: {
            highlights: [
              "Built a component platform adopted by 7 product squads",
              "Reduced dashboard interaction latency by 35%",
            ],
          },
        },
        {
          companyName: "Northstar Developer Tools",
          roleTitle: "Senior Product Engineer",
          startDate: new Date("2021-07-01"),
          endDate: new Date("2024-02-29"),
          isCurrent: false,
          outcomes: {
            highlights: [
              "Led editor workflow experiments that improved activation by 18%",
              "Partnered with PM and design on developer research loops",
            ],
          },
        },
        {
          companyName: "Kursa Labs",
          roleTitle: "AI Product Engineer",
          startDate: new Date("2024-03-01"),
          isCurrent: true,
          outcomes: {
            highlights: [
              "Prototyped career-observation signals using structured profile data",
              "Shipped a human-in-the-loop AI feedback surface for beta users",
            ],
          },
        },
      ],
    },
    achievements: {
      create: [
        {
          type: "SPEAKING",
          title: "From Dashboards to AI Product Loops",
          issuer: "Singapore Product Engineers Meetup",
          description:
            "Talk about using product telemetry and qualitative review to improve AI-assisted workflows.",
          dateAchieved: daysAgo(70),
        },
      ],
    },
    projects: {
      create: [
        {
          title: "Career Signal Engine Prototype",
          description:
            "Generated career observations from normalized profile signals and rule-based fallbacks.",
          url: "https://example.com/career-signal-engine",
          startDate: daysAgo(120),
          outcomes: {
            result: "Identified stale skills, overdue goals, and readiness gaps for test profiles.",
          },
        },
      ],
    },
    educations: {
      create: [
        {
          type: "course",
          credentialName: "Building AI Products with LLMs",
          issuer: "DeepLearning.AI",
          completionDate: daysAgo(150),
        },
      ],
    },
    languages: {
      create: [
        { name: "English", proficiency: "Native" },
        { name: "Japanese", proficiency: "Conversational" },
      ],
    },
    workAuthorizations: {
      create: [{ country: "SG", status: "Citizen" }],
    },
    constraints: {
      create: [
        { type: "remote_preference", value: "hybrid_or_remote" },
        { type: "focus_area", value: "applied_ai_product" },
      ],
    },
    socialLinks: {
      create: [
        { platform: "github", url: "https://github.com/kursa-ai-observation-test" },
        { platform: "linkedin", url: "https://linkedin.com/in/kursa-ai-observation-test" },
      ],
    },
  };
}

async function main() {
  console.log("Seeding AI observation test user...");

  await prisma.user.deleteMany({
    where: { id: { in: ["seed-ai-observation-user"] } },
  });

  const userWithSeedEmail = await prisma.user.findUnique({
    where: { email: TEST_USER.email },
    select: { id: true },
  });

  if (userWithSeedEmail && userWithSeedEmail.id !== TEST_USER.id) {
    await prisma.user.delete({ where: { id: userWithSeedEmail.id } });
  }

  await prisma.profile.deleteMany({ where: { userId: TEST_USER.id } });
  await prisma.account.deleteMany({
    where: { userId: TEST_USER.id, providerId: "credential" },
  });

  const password = await hashPassword(TEST_USER.password);

  const user = await prisma.user.upsert({
    where: { id: TEST_USER.id },
    update: {
      name: TEST_USER.name,
      email: TEST_USER.email,
      emailVerified: true,
      accounts: {
        create: {
          id: `${TEST_USER.id}-credential`,
          accountId: TEST_USER.id,
          providerId: "credential",
          password,
        },
      },
      profile: { create: profileData() },
    },
    create: {
      id: TEST_USER.id,
      name: TEST_USER.name,
      email: TEST_USER.email,
      emailVerified: true,
      accounts: {
        create: {
          id: `${TEST_USER.id}-credential`,
          accountId: TEST_USER.id,
          providerId: "credential",
          password,
        },
      },
      profile: { create: profileData() },
    },
    include: { profile: true },
  });

  console.log("AI observation seed complete.");
  console.log(`User ID: ${user.id}`);
  console.log(`Profile ID: ${user.profile?.id}`);
  console.log(`Email: ${TEST_USER.email}`);
  console.log(`Password: ${TEST_USER.password}`);
  console.log("Run observations after login or call GET /api/v1/profile/me/observations.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
