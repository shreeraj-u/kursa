"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
import AccountSection from "@/components/dashboard/settings/account-section";
import ConnectionsSection from "@/components/dashboard/settings/connections-section";
import NotificationsSection from "@/components/dashboard/settings/notifications-section";
import PlanSection from "@/components/dashboard/settings/plan-section";
import PrivacySection from "@/components/dashboard/settings/privacy-section";
import DocsSection from "@/components/dashboard/settings/docs-section";
import SettingsNav from "@/components/dashboard/settings/settings-nav";
import type { UserProfile } from "@/types/profile";

interface SettingsProps {
  profile: UserProfile | null;
  user: { name: string; email: string };
}

function SettingsBody({ profile, user }: SettingsProps) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "account";

  return (
    <div className="flex gap-8 min-h-[calc(100vh-44px)]">
      <div className="w-[180px] shrink-0">
        <SettingsNav activeSection={section} user={user} />
      </div>
      <div className="flex-1 max-w-[640px]">
        {section === "connections" && <ConnectionsSection socialLinks={profile?.socialLinks ?? []} />}
        {section === "account" && <AccountSection user={user} />}
        {section === "notifications" && <NotificationsSection />}
        {section === "privacy" && <PrivacySection />}
        {section === "plan" && <PlanSection />}
        {section === "docs" && <DocsSection />}
      </div>
    </div>
  );
}

export default function Settings({ profile, user }: SettingsProps) {
  return (
    <>
      <PageHeader pageTitle="Settings" />
      <div className="pt-6 px-8 pb-8">
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tighter text-ink">Settings</h1>
          <PageHelpButton help={DASHBOARD_PAGE_HELP.settings} label="Settings" />
        </div>
        <Suspense fallback={<div className="h-[calc(100vh-44px)]" />}>
          <SettingsBody profile={profile} user={user} />
        </Suspense>
      </div>
    </>
  );
}
