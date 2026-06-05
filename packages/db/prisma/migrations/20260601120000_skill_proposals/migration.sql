-- Extend SkillSource enum
ALTER TYPE "SkillSource" ADD VALUE IF NOT EXISTS 'inferred_chat';
ALTER TYPE "SkillSource" ADD VALUE IF NOT EXISTS 'market';
ALTER TYPE "SkillSource" ADD VALUE IF NOT EXISTS 'path';
ALTER TYPE "SkillSource" ADD VALUE IF NOT EXISTS 'user_edited';

-- Skill proposal enums
CREATE TYPE "SkillProposalType" AS ENUM ('add', 'update_confidence', 'mark_learning', 'mark_stale');
CREATE TYPE "SkillProposalSource" AS ENUM ('chat', 'market', 'path', 'journal');
CREATE TYPE "SkillProposalStatus" AS ENUM ('pending', 'accepted', 'dismissed');

CREATE TABLE "skill_proposal" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "proposalType" "SkillProposalType" NOT NULL,
    "suggestedConfidence" INTEGER,
    "suggestedProficiency" "SkillProficiency",
    "source" "SkillProposalSource" NOT NULL,
    "sourceRef" JSONB,
    "evidence" TEXT NOT NULL,
    "status" "SkillProposalStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_proposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "skill_proposal_profileId_status_idx" ON "skill_proposal"("profileId", "status");
CREATE INDEX "skill_proposal_userId_status_idx" ON "skill_proposal"("userId", "status");

CREATE UNIQUE INDEX "skill_proposal_pending_unique"
ON "skill_proposal"("profileId", "canonicalName", "proposalType")
WHERE "status" = 'pending';

ALTER TABLE "skill_proposal" ADD CONSTRAINT "skill_proposal_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
