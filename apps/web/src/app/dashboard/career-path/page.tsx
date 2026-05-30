import type { CareerPath } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import CareerPathPage from "./career-path";

export default async function Page() {
  await requireOnboarded();

  const pathsResult = await serverFetch<{ paths: CareerPath[] }>("/api/v1/profile/me/paths");
  const paths = pathsResult.ok ? pathsResult.data.paths : [];

  const obsResult = await serverFetch<{ materialChangeDetected?: boolean }>(
    "/api/v1/profile/me/observations?page=1&limit=1",
  );

  return (
    <CareerPathPage
      paths={paths}
      materialChangeDetected={obsResult.ok ? (obsResult.data.materialChangeDetected ?? false) : false}
    />
  );
}
