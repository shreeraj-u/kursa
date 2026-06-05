import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { authClient } from "@/lib/auth-client";
import { serverFetch } from "@/lib/server-fetch";

export type OnboardingStatus = {
  onboardingDone: boolean;
  hasProfile: boolean;
};

/** One get-session call per RSC request (layout + page share this). */
export const getServerSession = cache(async () =>
  authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  }),
);

export async function requireSession() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Ensures the user finished onboarding. API failures do NOT send users back to onboarding.
 */
export async function requireOnboarded() {
  const session = await requireSession();

  const statusResult = await serverFetch<OnboardingStatus>("/api/v1/onboarding/status");

  if (statusResult.ok && !statusResult.data.onboardingDone) {
    redirect("/onboarding");
  }

  return { session, status: statusResult.ok ? statusResult.data : null };
}
