import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@kursa/db";
import { authClient } from "@/lib/auth-client";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile, DashboardMetrics } from "@/types/profile";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Gate the dashboard behind completed onboarding (Layer 1 profiling).
  const onboardingProfile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  if (!onboardingProfile.onboardingDone) {
    redirect("/onboarding");
  }

  const [profileData, metricsData] = await Promise.all([
    serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me").catch(() => null),
    serverFetch<DashboardMetrics>("/api/v1/profile/me/dashboard").catch(() => null)
  ]);

  const profile = profileData?.profile ?? null;
  const metrics = metricsData ?? null;

  const user = {
    name: session.user.name,
    email: session.user.email,
    createdAt: session.user.createdAt.toString(),
  };

  return <Dashboard profile={profile} user={user} initialObservations={null} metrics={metrics} />;
}
