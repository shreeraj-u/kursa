import { redirect } from "next/navigation";

import { serverFetch } from "@/lib/server-fetch";

import OnboardingChat from "@/components/onboarding/onboarding-chat";

type OnboardingStatus = { onboardingDone: boolean; hasProfile: boolean };

export default async function OnboardingPage() {
  const status = await serverFetch<OnboardingStatus>("/api/v1/onboarding/status");

  if (status?.onboardingDone) {
    redirect("/dashboard");
  }

  return <OnboardingChat />;
}
