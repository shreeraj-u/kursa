import type { SkillsOverviewResponse } from "@kursa/types";

import { requireOnboarded } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";

import SkillsPageClient from "@/components/dashboard/skills/skills-page-client";

export default async function SkillsPage() {
  await requireOnboarded();

  const result = await serverFetch<SkillsOverviewResponse>("/api/v1/profile/me/skills/overview");

  return (
    <SkillsPageClient
      initialOverview={
        result.ok
          ? result.data
          : {
              skills: [],
              recommendations: [],
              proposals: [],
              learningGoals: [],
              signals: {
                profileCompleteness: 0,
                staleCount: 0,
                marketAlignedCount: 0,
                pendingProposalCount: 0,
              },
            }
      }
    />
  );
}
