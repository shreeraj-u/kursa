import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile } from "@/types/profile";

import Settings from "./settings";

export default async function SettingsPage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers(), throw: true },
  });

  if (!session?.user) {
    redirect("/login");
  }

  const profileData = await serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me").catch(() => null);
  const profile = profileData?.profile ?? null;

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return <Settings profile={profile} user={user} />;
}
