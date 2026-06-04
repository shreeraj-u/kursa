import type { CareerJourneyResponse, ResumeListResponse } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import ResumeStudio from "@/components/dashboard/resume/resume-studio";

export default async function Page() {
  await requireOnboarded();

  const [dataResult, journeyResult] = await Promise.all([
    serverFetch<ResumeListResponse>("/api/v1/profile/me/resumes"),
    serverFetch<CareerJourneyResponse>("/api/v1/profile/me/journey"),
  ]);

  return (
    <ResumeStudio
      initialResumes={dataResult.ok ? dataResult.data.resumes : []}
      quota={dataResult.ok ? dataResult.data.quota : { used: 0, limit: 10 }}
      activeJourneyTitle={journeyResult.ok ? journeyResult.data.journey?.title ?? null : null}
    />
  );
}
