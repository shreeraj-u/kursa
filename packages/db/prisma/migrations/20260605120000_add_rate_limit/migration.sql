-- Better Auth database rate-limit storage (applied on remote; kept for migration history parity)
CREATE TABLE IF NOT EXISTS "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rateLimit_key_key" ON "rateLimit"("key");
