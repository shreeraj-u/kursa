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
import ProfileCollapsibleSection from "@/components/dashboard/profile/profile-collapsible-section";
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

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <ProfileCollapsibleSection
            id="basics"
            eyebrow="basics"
            title="Basics"
            description="Your public identity on Kursa."
          >
            <BasicsSection profile={profile} user={user} />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="experience"
            eyebrow="experience"
            title="Work experience"
            description="Roles and outcomes that shape your career story."
            count={profile?.workHistories.length ?? 0}
          >
            <WorkHistorySection items={profile?.workHistories ?? []} />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="projects"
            eyebrow="projects"
            title="Projects"
            description="Side projects, open source, and portfolio work."
            count={profile?.projects.length ?? 0}
          >
            <ProjectsSection items={profile?.projects ?? []} />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="achievements"
            eyebrow="achievements"
            title="Achievements"
            description="Awards, publications, speaking, and other highlights."
            count={profile?.achievements.length ?? 0}
          >
            <AchievementsSection items={profile?.achievements ?? []} />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="education"
            eyebrow="education"
            title="Education"
            description="Degrees, certifications, and courses."
            count={profile?.educations.length ?? 0}
          >
            <EducationSection items={profile?.educations ?? []} />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="languages"
            eyebrow="languages"
            title="Languages"
            description="Languages you speak and your proficiency level."
            count={profile?.languages.length ?? 0}
          >
            <LanguagesSection items={profile?.languages ?? []} />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="career-prefs"
            eyebrow="career"
            title="Career preferences"
            description="Shape how Kursa understands your career direction and generates paths for you."
          >
            <CareerPrefsSection profile={profile} />
          </ProfileCollapsibleSection>
        </div>
      </div>
    </div>
  );
}
