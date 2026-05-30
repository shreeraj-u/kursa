import dotenv from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../prisma/generated/client";

dotenv.config({ path: "../../apps/server/.env" });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const PROFILE_INCLUDE = {
  skills: true,
  workHistories: true,
  educations: true,
  achievements: true,
  projects: true,
  languages: true,
  workAuthorizations: true,
  constraints: true,
  learningGoals: true,
  socialLinks: true,
  jobApplications: true,
} as const;

async function main() {
  const userId = "TtPb9fo5IHZU81TTnts5JDSHO17l4jab";
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });
  console.log("found:", !!profile, "onboardingDone:", profile?.onboardingDone);
  console.log("JSON size:", JSON.stringify(profile).length);
}

main()
  .catch((e) => {
    console.error("QUERY FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
