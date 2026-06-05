import { redirect } from "next/navigation";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile, DashboardMetrics } from "@/types/profile";
import type { CareerJourneyResponse, JourneyActionItem, ProactiveNudge, RelevanceSummary } from "@kursa/types";

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

  const [journeyResult, proactiveResult, relevanceResult] = await Promise.all([
    serverFetch<CareerJourneyResponse>("/api/v1/profile/me/journey"),
    serverFetch<{ nudges: ProactiveNudge[] }>("/api/v1/journal/proactive"),
    serverFetch<RelevanceSummary>("/api/v1/journal/relevance"),
  ]);

  const topAction: JourneyActionItem | null =
    journeyResult.ok && journeyResult.data.actionQueue.length > 0
      ? journeyResult.data.actionQueue[0]
      : null;
  const activeJourney = journeyResult.ok ? journeyResult.data.journey : null;
  const initialNudges = proactiveResult.ok ? proactiveResult.data.nudges : [];
  const initialRelevance = relevanceResult.ok ? relevanceResult.data : null;

  const user = {
    name: session.user.name,
    email: session.user.email,
    createdAt: session.user.createdAt.toString(),
  };

  return (
    <Dashboard
      user={user}
      initialNudges={initialNudges}
      initialRelevance={initialRelevance}
      metrics={metrics}
      topAction={topAction}
      activeJourney={activeJourney}
    />
  );
}
