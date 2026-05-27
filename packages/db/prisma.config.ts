import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: "../../apps/server/.env",
});

// Provide a fallback so `prisma generate` works in CI / fresh checkouts
// where apps/server/.env doesn't exist yet.
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://dummy:dummy@localhost:5432/dummy";

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: DATABASE_URL,
  },
});
