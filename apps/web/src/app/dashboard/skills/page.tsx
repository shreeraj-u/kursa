import type { UserProfile } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import { SkillsStudio } from "@/components/dashboard/skills/skills-studio";

export default async function Page() {
  await requireOnboarded();

  const profileResult = await serverFetch<{ profile: UserProfile | null }>(
    "/api/v1/profile/me",
  );
  const profile = profileResult.ok ? profileResult.data.profile : null;

  return (
    <SkillsStudio
      initialSkills={profile?.skills ?? []}
      initialGoals={profile?.learningGoals ?? []}
    />
  );
}

