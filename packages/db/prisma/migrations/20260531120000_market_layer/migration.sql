-- CreateTable
CREATE TABLE "market_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_listing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "location" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "postedAt" TIMESTAMP(3),
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_snapshot_userId_idx" ON "market_snapshot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "market_snapshot_userId_roleKey_key" ON "market_snapshot"("userId", "roleKey");

-- CreateIndex
CREATE INDEX "job_listing_userId_createdAt_idx" ON "job_listing"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "market_snapshot" ADD CONSTRAINT "market_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_listing" ADD CONSTRAINT "job_listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
