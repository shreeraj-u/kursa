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
  // If tables are missing, these model accessors throw at query time.
  await Promise.all([
    prisma.careerEvent.count(),
    prisma.userMemory.count(),
    prisma.persistedObservation.count(),
    prisma.conversation.count(),
    prisma.chatMessage.count(),
  ]);

  // skill.source column — query succeeds only if column exists
  await prisma.skill.findFirst({ select: { source: true } });

  console.log("Tables verified via Prisma models:");
  console.log("  career_event, user_memory, persisted_observation, conversation, chat_message");
  console.log("  skill.source column");
  console.log("Intelligence layer schema verified OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
