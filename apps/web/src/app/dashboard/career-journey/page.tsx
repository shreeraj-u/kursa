import type { CareerJourneyResponse, UserProfile } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import CareerJourneyPage from "@/components/dashboard/career-journey/career-journey";

export default async function Page() {
  await requireOnboarded();

  const [profileResult, result] = await Promise.all([
    serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me"),
    serverFetch<CareerJourneyResponse>("/api/v1/profile/me/journey"),
  ]);
  const data = result.ok
    ? result.data
    : { journey: null, timeline: [], actionQueue: [] };

  const obsResult = await serverFetch<{ materialChangeDetected?: boolean }>(
    "/api/v1/profile/me/observations?page=1&limit=1",
  );

  return (
    <CareerJourneyPage
      data={data}
      profile={profileResult.ok ? profileResult.data.profile : null}
      materialChangeDetected={
        obsResult.ok ? (obsResult.data.materialChangeDetected ?? false) : false
      }
    />
  );
}
