import type { CareerJourneyResponse, UserProfile } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import CareerGraphPage from "@/components/dashboard/career-graph/career-graph";

export default async function Page() {
  await requireOnboarded();

  const [profileResult, journeyResult] = await Promise.all([
    serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me"),
    serverFetch<CareerJourneyResponse>("/api/v1/profile/me/journey"),
  ]);

  const profile = profileResult.ok ? profileResult.data.profile : null;
  const journey = journeyResult.ok ? journeyResult.data.journey : null;

  return <CareerGraphPage profile={profile} journey={journey} />;
}
