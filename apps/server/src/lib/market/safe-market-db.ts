import { Prisma } from "@kursa/db";

/** True when market tables were never migrated (P2021). */
export function isMarketTableMissingError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2021" &&
    String(err.meta?.modelName ?? "").includes("Market")
  ) || (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2021" &&
    String(err.message).includes("market_snapshot")
  );
}
