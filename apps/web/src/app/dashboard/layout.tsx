import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Sidebar from "@/components/dashboard/sidebar";
import { authClient } from "@/lib/auth-client";
import { serverFetch } from "@/lib/server-fetch";
import type { UserProfile } from "@/types/profile";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await authClient.getSession({
        fetchOptions: {
            headers: await headers(),
            throw: true,
        },
    });

    if (!session?.user) {
        redirect("/login");
    }

    // Best-effort profile fetch — badges degrade gracefully if unavailable
    let profile: UserProfile | null = null;
    try {
        const profileData = await serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me");
        profile = profileData?.profile ?? null;
    } catch {
        // non-fatal: sidebar renders without badges
    }

    const now = Date.now();

    const attentionCount =
        profile?.learningGoals?.filter(
            (g) => g.deadline !== null && new Date(g.deadline).getTime() < now
        ).length ?? 0;

    const applicationCount =
        profile?.jobApplications?.filter(
            (a) => a.status === "active"
        ).length ?? 0;

    const user = {
        name: session.user.name,
        email: session.user.email,
        createdAt: session.user.createdAt.toString(),
    };

    return (
        <div className="flex h-svh overflow-hidden" style={{ background: "var(--bg)" }}>
            <Sidebar
                user={user}
                attentionCount={attentionCount}
                applicationCount={applicationCount}
            />
            <main
                className="flex-1 overflow-y-auto"
                style={{ background: "var(--bg)" }}
            >
                <div className="max-w-full mx-auto px-6 py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
