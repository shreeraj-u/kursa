import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { CareerPath } from "@kursa/types";

import { authClient } from "@/lib/auth-client";
import { serverFetch } from "@/lib/server-fetch";

import CareerPathPage from "./career-path";

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

  const profileData = await serverFetch<{ profile: { onboardingDone: boolean } | null }>(
    "/api/v1/profile/me",
  ).catch(() => null);
  const profile = profileData?.profile ?? null;

  if (!profile?.onboardingDone) {
    redirect("/onboarding");
  }

  const pathsData = await serverFetch<{ paths: CareerPath[] }>(
    "/api/v1/profile/me/paths",
  ).catch(() => null);
  const paths = pathsData?.paths ?? [];

  return <CareerPathPage paths={paths} />;
}
