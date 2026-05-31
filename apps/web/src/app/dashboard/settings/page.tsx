import { redirect } from "next/navigation";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile } from "@/types/profile";

import Settings from "./settings";

export default async function SettingsPage() {
  const { session } = await requireOnboarded();

  const profileResult = await serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me");
  const profile = profileResult.ok ? profileResult.data.profile : null;

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return <Settings profile={profile} user={user} />;
}
