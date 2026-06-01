import type { ApplicationListResponse } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import ApplicationsClient from "@/components/dashboard/applications/applications-client";

export default async function Page() {
  await requireOnboarded();

  const result = await serverFetch<ApplicationListResponse>("/api/v1/profile/me/applications");

  return (
    <ApplicationsClient
      initialApplications={result.ok ? result.data.applications : []}
    />
  );
}
