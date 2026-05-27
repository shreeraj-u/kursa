/*
  Warnings:

  - You are about to drop the column `currentRole` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `work_history` table. All the data in the column will be lost.
  - You are about to drop the column `companySize` on the `work_history` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `work_history` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `work_history` table. All the data in the column will be lost.
  - You are about to drop the column `teamStructure` on the `work_history` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `work_history` table. All the data in the column will be lost.
  - You are about to drop the `preference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_skill` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `companyName` to the `work_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `work_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleTitle` to the `work_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "preference" DROP CONSTRAINT "preference_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_skill" DROP CONSTRAINT "user_skill_userId_fkey";

-- DropForeignKey
ALTER TABLE "work_history" DROP CONSTRAINT "work_history_userId_fkey";

-- DropIndex
DROP INDEX "work_history_userId_idx";

-- AlterTable
ALTER TABLE "profile" DROP COLUMN "currentRole",
ADD COLUMN     "aspirations" JSONB,
ADD COLUMN     "targetRole" TEXT,
ADD COLUMN     "values" JSONB,
ADD COLUMN     "yearsOfExperience" INTEGER;

-- AlterTable
ALTER TABLE "work_history" DROP COLUMN "company",
DROP COLUMN "companySize",
DROP COLUMN "description",
DROP COLUMN "role",
DROP COLUMN "teamStructure",
DROP COLUMN "userId",
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "outcomes" JSONB,
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "roleTitle" TEXT NOT NULL;

-- DropTable
DROP TABLE "preference";

-- DropTable
DROP TABLE "user_skill";

-- CreateTable
CREATE TABLE "skill" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "proficiencyLevel" TEXT,
    "confidenceRating" INTEGER,
    "lastUsedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "credentialName" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT,
    "description" TEXT,
    "url" TEXT,
    "dateAchieved" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "workHistoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "outcomes" JSONB,
    "technologies" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AchievementToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AchievementToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_profileId_name_key" ON "skill"("profileId", "name");

-- CreateIndex
CREATE INDEX "education_profileId_idx" ON "education"("profileId");

-- CreateIndex
CREATE INDEX "achievement_profileId_idx" ON "achievement"("profileId");

-- CreateIndex
CREATE INDEX "project_profileId_idx" ON "project"("profileId");

-- CreateIndex
CREATE INDEX "project_workHistoryId_idx" ON "project"("workHistoryId");

-- CreateIndex
CREATE INDEX "_AchievementToSkill_B_index" ON "_AchievementToSkill"("B");

-- CreateIndex
CREATE INDEX "_ProjectToSkill_B_index" ON "_ProjectToSkill"("B");

-- CreateIndex
CREATE INDEX "work_history_profileId_idx" ON "work_history"("profileId");

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "skill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_history" ADD CONSTRAINT "work_history_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement" ADD CONSTRAINT "achievement_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_workHistoryId_fkey" FOREIGN KEY ("workHistoryId") REFERENCES "work_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AchievementToSkill" ADD CONSTRAINT "_AchievementToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AchievementToSkill" ADD CONSTRAINT "_AchievementToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToSkill" ADD CONSTRAINT "_ProjectToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
