/*
  Warnings:

  - Changed the type of `type` on the `achievement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('HACKATHON', 'AWARD', 'PUBLICATION', 'SPEAKING', 'OPEN_SOURCE', 'VOLUNTEER', 'OTHER');

-- AlterTable
ALTER TABLE "achievement" DROP COLUMN "type",
ADD COLUMN     "type" "AchievementType" NOT NULL;
