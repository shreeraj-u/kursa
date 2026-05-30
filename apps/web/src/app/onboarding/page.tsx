import { redirect } from "next/navigation";

import { requireSession, type OnboardingStatus } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import OnboardingChat from "@/components/onboarding/onboarding-chat";

export default async function OnboardingPage() {
  const session = await requireSession();

  const statusResult = await serverFetch<OnboardingStatus>("/api/v1/onboarding/status");
  const status = statusResult.ok ? statusResult.data : null;

  if (status?.onboardingDone) {
    redirect("/dashboard");
  }

  // Authenticated but status unknown (API blip) — don't restart onboarding.
  if (status === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-6 py-24 text-center">
        <p className="eyebrow">connection issue</p>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--ink)" }}>
          Couldn&apos;t verify your profile
        </h1>
        <p style={{ fontSize: 14, color: "var(--mute)" }}>
          Signed in as {session.user.email}. Refresh to try again, or continue to the dashboard if
          you&apos;ve already completed onboarding.
        </p>
        <a
          href="/dashboard"
          className="rounded-md border border-line px-4 py-2 text-sm"
          style={{ color: "var(--ink)" }}
        >
          Go to dashboard
        </a>
      </div>
    );
  }

  return <OnboardingChat />;
}
