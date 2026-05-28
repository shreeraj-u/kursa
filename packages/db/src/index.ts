import { env } from "@kursa/env/server";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient, Prisma } from "../prisma/generated/client";

export { Prisma, PrismaClient };

export function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;
