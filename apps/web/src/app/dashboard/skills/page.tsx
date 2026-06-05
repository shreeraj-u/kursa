import type { CareerJourneyResponse, SkillsOverviewResponse, UserProfile } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import { SkillsStudio } from "@/components/dashboard/skills/skills-studio";

export default async function Page() {
  await requireOnboarded();

  const [profileResult, journeyResult, overviewResult] = await Promise.all([
    serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me"),
    serverFetch<CareerJourneyResponse>("/api/v1/profile/me/journey"),
    serverFetch<SkillsOverviewResponse>("/api/v1/profile/me/skills/overview"),
  ]);

  const profile = profileResult.ok ? profileResult.data.profile : null;
  const activePath = journeyResult.ok ? journeyResult.data.journey : null;
  const overview = overviewResult.ok ? overviewResult.data : null;

  return (
    <SkillsStudio
      initialSkills={profile?.skills ?? []}
      initialGoals={profile?.learningGoals ?? []}
      activePath={activePath}
      initialOverview={overview}
    />
  );
}
