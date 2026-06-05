-- AlterTable
ALTER TABLE "conversation" ADD COLUMN "careerPathId" TEXT;

-- CreateIndex
CREATE INDEX "conversation_careerPathId_idx" ON "conversation"("careerPathId");
