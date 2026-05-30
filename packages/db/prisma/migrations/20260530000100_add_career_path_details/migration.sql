-- CreateTable
CREATE TABLE IF NOT EXISTS "career_path" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "projectedTimelineMonths" INTEGER NOT NULL,
    "milestones" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_path_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_path_profileId_idx" ON "career_path"("profileId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'career_path_profileId_fkey' AND table_name = 'career_path'
    ) THEN
        ALTER TABLE "career_path" ADD CONSTRAINT "career_path_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add structured AI-generated rationale and action details for richer career path exploration.
ALTER TABLE "career_path" ADD COLUMN IF NOT EXISTS "details" JSONB;
