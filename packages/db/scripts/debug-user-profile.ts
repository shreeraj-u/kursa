import dotenv from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../prisma/generated/client";

dotenv.config({ path: "../../apps/server/.env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      accounts: { select: { providerId: true, accountId: true } },
      profile: {
        select: {
          id: true,
          onboardingDone: true,
          targetRole: true,
          _count: { select: { skills: true, workHistories: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
