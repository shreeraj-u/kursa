import { redirect } from "next/navigation";

import DashboardFirstRunGuide from "@/components/dashboard/dashboard-first-run-guide";
import Sidebar from "@/components/dashboard/sidebar";
import { getServerSession } from "@/lib/require-onboarded";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile } from "@/types/profile";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession();

    if (!session?.user) {
        redirect("/login");
    }

    // Best-effort profile fetch — badges degrade gracefully if unavailable
    let profile: UserProfile | null = null;
    const profileResult = await serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me");
    if (profileResult.ok) {
        profile = profileResult.data.profile;
    }

    const now = Date.now();

    // Must stay in sync with dashboard.compute.ts greeting.attentionCount logic
    const attentionCount =
        profile?.learningGoals?.filter(
            (g) => g.deadline !== null && new Date(g.deadline).getTime() < now
        ).length ?? 0;

    const applicationCount =
        profile?.jobApplications?.filter(
            (a) => a.status === "active"
        ).length ?? 0;

    const proposalsResult = await serverFetch<{ data: unknown[]; total: number }>(
        "/api/v1/profile/me/skill-proposals?status=pending&limit=1",
    );
    const skillsProposalCount = proposalsResult.ok ? proposalsResult.data.total : 0;

    const user = {
        name: session.user.name,
        email: session.user.email,
        createdAt: session.user.createdAt.toString(),
    };

    const shouldShowFirstRunGuide = Boolean(profile?.onboardingDone && !profile.dashboardGuideCompletedAt);

    return (
        <div className="flex h-svh overflow-hidden" style={{ background: "var(--bg)" }}>
            <Sidebar
                user={user}
                attentionCount={attentionCount}
                applicationCount={applicationCount}
                skillsProposalCount={skillsProposalCount}
            />
            <main
                className="flex-1 overflow-y-auto"
                style={{ background: "var(--bg)" }}
            >
                <div className="max-w-full mx-auto px-6 py-6">
                    {children}
                </div>
            </main>
            <DashboardFirstRunGuide shouldShow={shouldShowFirstRunGuide} />
        </div>
    );
}
