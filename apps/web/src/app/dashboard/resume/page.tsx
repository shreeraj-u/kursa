import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ResumeListResponse } from "@kursa/types";

import { authClient } from "@/lib/auth-client";
import { serverFetch } from "@/lib/server-fetch";

import ResumeStudio from "@/components/dashboard/resume/resume-studio";

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

  const data = await serverFetch<ResumeListResponse>("/api/v1/profile/me/resumes").catch(
    () => null,
  );

  return (
    <ResumeStudio
      initialResumes={data?.resumes ?? []}
      quota={data?.quota ?? { used: 0, limit: 10 }}
    />
  );
}
