import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserProfile } from "@kursa/types";

import { authClient } from "@/lib/auth-client";
import { serverFetch } from "@/lib/server-fetch";

import { SkillsStudio } from "@/components/dashboard/skills/skills-studio";

export default async function Page() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  const profileData = await serverFetch<{ profile: UserProfile | null }>(
    "/api/v1/profile/me",
  ).catch(() => null);
  const profile = profileData?.profile ?? null;

  if (!profile?.onboardingDone) {
    redirect("/onboarding");
  }

  return (
    <SkillsStudio
      initialSkills={profile.skills ?? []}
      initialGoals={profile.learningGoals ?? []}
    />
  );
}
