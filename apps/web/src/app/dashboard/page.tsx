import { redirect } from "next/navigation";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile, DashboardMetrics } from "@/types/profile";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const { session } = await requireOnboarded();

  const profileResult = await serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me");
  const profile = profileResult.ok ? profileResult.data.profile : null;

  if (profileResult.ok && profile && !profile.onboardingDone) {
    redirect("/onboarding");
  }

  const metricsResult = await serverFetch<DashboardMetrics>("/api/v1/profile/me/dashboard");
  const metrics = metricsResult.ok ? metricsResult.data : null;

  // Observations can trigger LLM work — load client-side so the dashboard shell renders immediately.
  const initialObservations = null;
  const observationsError = null;

  const user = {
    name: session.user.name,
    email: session.user.email,
    createdAt: session.user.createdAt.toString(),
  };

  return (
    <Dashboard
      profile={profile}
      user={user}
      initialObservations={initialObservations}
      observationsError={observationsError}
      metrics={metrics}
    />
  );
}
