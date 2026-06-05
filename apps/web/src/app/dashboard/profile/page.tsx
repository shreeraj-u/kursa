import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile } from "@/types/profile";

import ProfilePage from "./profile-page";

export default async function Page() {
  const { session } = await requireOnboarded();

  const profileResult = await serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me");
  const profile = profileResult.ok ? profileResult.data.profile : null;

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return <ProfilePage profile={profile} user={user} />;
}
