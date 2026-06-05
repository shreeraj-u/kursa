import { redirect } from "next/navigation";
import type { Route } from "next";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile } from "@/types/profile";

import Settings from "./settings";

const PROFILE_REDIRECTS: Record<string, Route> = {
  profile: "/dashboard/profile" as Route,
  career: "/dashboard/profile#career-prefs" as Route,
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const params = await searchParams;
  const section = params.section ?? "account";
  const redirectTo = PROFILE_REDIRECTS[section];
  if (redirectTo) {
    redirect(redirectTo);
  }

  const { session } = await requireOnboarded();

  const profileResult = await serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me");
  const profile = profileResult.ok ? profileResult.data.profile : null;

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return <Settings profile={profile} user={user} />;
}
