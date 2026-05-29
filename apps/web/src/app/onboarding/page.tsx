import { redirect } from "next/navigation";

import { getOnboardingStatus } from "./actions";
import OnboardingChat from "./_components/onboarding-chat";

export default async function OnboardingPage() {
  const status = await getOnboardingStatus();

  if (status.onboardingDone) {
    redirect("/dashboard");
  }

  return <OnboardingChat />;
}
