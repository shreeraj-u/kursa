import type { SkillsOverviewResponse, UserProfile } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import { SkillsStudio } from "@/components/dashboard/skills/skills-studio";

export default async function Page() {
  await requireOnboarded();

  const [profileResult, overviewResult] = await Promise.all([
    serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me"),
    serverFetch<SkillsOverviewResponse>("/api/v1/profile/me/skills/overview"),
  ]);

  const profile = profileResult.ok ? profileResult.data.profile : null;
  const overview = overviewResult.ok ? overviewResult.data : null;

  return (
    <SkillsStudio
      initialSkills={profile?.skills ?? []}
      initialOverview={overview}
    />
  );
}
