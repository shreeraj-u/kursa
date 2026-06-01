import type { CareerPath, UserProfile } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import { SkillsStudio } from "@/components/dashboard/skills/skills-studio";

export default async function Page() {
  await requireOnboarded();

  const [profileResult, pathsResult] = await Promise.all([
    serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me"),
    serverFetch<{ paths: CareerPath[] }>("/api/v1/profile/me/paths"),
  ]);

  const profile = profileResult.ok ? profileResult.data.profile : null;
  const activePath = pathsResult.ok
    ? (pathsResult.data.paths.find((p) => p.isActive) ?? null)
    : null;

  return (
    <SkillsStudio
      initialSkills={profile?.skills ?? []}
      initialGoals={profile?.learningGoals ?? []}
      activePath={activePath}
    />
  );
}

