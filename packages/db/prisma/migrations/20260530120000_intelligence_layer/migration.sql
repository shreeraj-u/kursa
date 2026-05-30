-- CreateEnum
CREATE TYPE "CareerEventType" AS ENUM ('checkin_weekly', 'checkin_monthly', 'win', 'note', 'feedback', 'decision', 'learning', 'aria_observation', 'profile_import', 'onboarding_complete', 'application_update', 'system');

-- CreateEnum
CREATE TYPE "CareerEventSource" AS ENUM ('user', 'aria', 'system');

-- CreateEnum
CREATE TYPE "SkillSource" AS ENUM ('self_reported', 'resume', 'inferred_checkin', 'inferred_journal');

-- AlterTable
ALTER TABLE "skill" ADD COLUMN "source" "SkillSource";

-- CreateTable
CREATE TABLE "career_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "CareerEventType" NOT NULL,
    "source" "CareerEventSource" NOT NULL,
    "body" TEXT,
    "structured" JSONB NOT NULL,
    "sentiment" DOUBLE PRECISION,
    "linkedSkillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedPathId" TEXT,
    "linkedWorkHistoryId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "career_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_memory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceEntryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "supersededBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persisted_observation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "signalsHash" TEXT NOT NULL,
    "sourceEntryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "persisted_observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decisionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "career_event_userId_occurredAt_idx" ON "career_event"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "career_event_profileId_type_idx" ON "career_event"("profileId", "type");

-- CreateIndex
CREATE INDEX "user_memory_userId_category_idx" ON "user_memory"("userId", "category");

-- CreateIndex
CREATE INDEX "persisted_observation_profileId_createdAt_idx" ON "persisted_observation"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "conversation_userId_idx" ON "conversation"("userId");

-- CreateIndex
CREATE INDEX "chat_message_conversationId_idx" ON "chat_message"("conversationId");

-- AddForeignKey
ALTER TABLE "career_event" ADD CONSTRAINT "career_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_event" ADD CONSTRAINT "career_event_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memory" ADD CONSTRAINT "user_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persisted_observation" ADD CONSTRAINT "persisted_observation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persisted_observation" ADD CONSTRAINT "persisted_observation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
