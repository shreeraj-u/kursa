-- Track account-wide completion of the first-run dashboard guide.
ALTER TABLE "profile" ADD COLUMN "dashboardGuideCompletedAt" TIMESTAMP(3);

-- Existing onboarded users are not first-time dashboard users for this rollout.
UPDATE "profile"
SET "dashboardGuideCompletedAt" = NOW()
WHERE "onboardingDone" = TRUE;
