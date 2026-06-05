"use client";

import Link from "next/link";
import type { Route } from "next";
import { BarChart2, Link2 } from "lucide-react";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
import BasicsSection from "@/components/dashboard/profile/basics-section";
import CareerPrefsSection from "@/components/dashboard/profile/career-prefs-section";
import WorkHistorySection from "@/components/dashboard/profile/work-history-section";
import ProjectsSection from "@/components/dashboard/profile/projects-section";
import AchievementsSection from "@/components/dashboard/profile/achievements-section";
import EducationSection from "@/components/dashboard/profile/education-section";
import LanguagesSection from "@/components/dashboard/profile/languages-section";
import type { UserProfile } from "@/types/profile";

interface ProfilePageProps {
  profile: UserProfile | null;
  user: { name: string; email: string };
}

const RELATED_LINKS = [
  { href: "/dashboard/skills" as Route, label: "Skills", Icon: BarChart2 },
  { href: "/dashboard/settings?section=connections" as Route, label: "Connections", Icon: Link2 },
] as const;

export default function ProfilePage({ profile, user }: ProfilePageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Profile" />
      <div className="flex flex-col gap-8 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-ink">Profile</h1>
              <PageHelpButton help={DASHBOARD_PAGE_HELP.profile} label="Profile" />
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-mute">
              Your career evidence — experience, projects, achievements, and preferences that power journeys, résumés, and Aria.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {RELATED_LINKS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="mono inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] text-mute transition-colors hover:border-line-2 hover:text-ink-2"
                >
                  <Icon size={11} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
          <section id="basics" className="scroll-mt-16">
            <BasicsSection profile={profile} user={user} />
          </section>
          <section id="experience" className="scroll-mt-16">
            <WorkHistorySection items={profile?.workHistories ?? []} />
          </section>
          <section id="projects" className="scroll-mt-16">
            <ProjectsSection items={profile?.projects ?? []} />
          </section>
          <section id="achievements" className="scroll-mt-16">
            <AchievementsSection items={profile?.achievements ?? []} />
          </section>
          <section id="education" className="scroll-mt-16">
            <EducationSection items={profile?.educations ?? []} />
          </section>
          <section id="languages" className="scroll-mt-16">
            <LanguagesSection items={profile?.languages ?? []} />
          </section>
          <section id="career-prefs" className="scroll-mt-16">
            <CareerPrefsSection profile={profile} />
          </section>
        </div>
      </div>
    </div>
  );
}
