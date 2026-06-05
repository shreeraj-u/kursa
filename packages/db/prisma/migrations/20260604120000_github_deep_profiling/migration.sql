-- AlterEnum
ALTER TYPE "CareerEventType" ADD VALUE 'github_activity';

-- AlterEnum
ALTER TYPE "SkillProposalSource" ADD VALUE 'github';

-- CreateEnum
CREATE TYPE "ProjectProposalStatus" AS ENUM ('pending', 'accepted', 'dismissed');

-- CreateTable
CREATE TABLE "github_profile_snapshot" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "normalized" JSONB NOT NULL DEFAULT '{}',
    "lastIngestedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_profile_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_sync_run" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "delta" JSONB NOT NULL DEFAULT '{}',
    "workPatterns" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "github_sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_proposal" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "outcomes" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "evidence" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'github',
    "sourceRef" JSONB,
    "status" "ProjectProposalStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_profile_snapshot_profileId_key" ON "github_profile_snapshot"("profileId");

-- CreateIndex
CREATE INDEX "github_sync_run_profileId_ranAt_idx" ON "github_sync_run"("profileId", "ranAt");

-- CreateIndex
CREATE INDEX "project_proposal_profileId_status_idx" ON "project_proposal"("profileId", "status");

-- CreateIndex
CREATE INDEX "project_proposal_userId_status_idx" ON "project_proposal"("userId", "status");

-- AddForeignKey
ALTER TABLE "github_profile_snapshot" ADD CONSTRAINT "github_profile_snapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_sync_run" ADD CONSTRAINT "github_sync_run_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proposal" ADD CONSTRAINT "project_proposal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
