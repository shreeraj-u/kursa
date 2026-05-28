-- CreateTable
CREATE TABLE "job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "workEnvironment" TEXT,
    "description" TEXT,
    "url" TEXT,
    "industry" TEXT,
    "experienceLevel" TEXT,
    "companySize" TEXT,
    "source" TEXT,
    "sourceId" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "equity" TEXT,
    "benefits" TEXT[],
    "skills" TEXT[],
    "requirements" TEXT[],
    "responsibilities" TEXT[],
    "metadata" JSONB,
    "rawPosting" JSONB,
    "postedAt" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_application" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobId" TEXT,
    "company" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "fitScore" INTEGER,
    "appliedAt" TIMESTAMP(3),
    "nextAction" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_title_company_idx" ON "job"("title", "company");

-- CreateIndex
CREATE INDEX "job_source_sourceId_idx" ON "job"("source", "sourceId");

-- CreateIndex
CREATE INDEX "job_application_profileId_idx" ON "job_application"("profileId");

-- CreateIndex
CREATE INDEX "job_application_jobId_idx" ON "job_application"("jobId");

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
