"use client";

import { useMemo, useState } from "react";
import type { CareerJourney, UserSkill, UserLearningGoal } from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";

import { SkillInventory } from "./skill-inventory";
import { LearningGoals } from "./learning-goals";
import { SkillGap } from "./skill-gap";

interface SkillsStudioProps {
  initialSkills: UserSkill[];
  initialGoals: UserLearningGoal[];
  activePath: CareerJourney | null;
}

function StatCard({ value, label, tone }: { value: string | number; label: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-center">
      <div className="text-lg font-semibold leading-none text-[var(--ink)]" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      <div className="mono mt-0.5 text-[10px] text-[var(--mute)]">{label}</div>
    </div>
  );
}

function SetupChecklist({
  skills,
  goals,
  activePath,
}: {
  skills: UserSkill[];
  goals: UserLearningGoal[];
  activePath: CareerJourney | null;
}) {
  const gaps = activePath?.details?.skillGaps ?? [];
  const missingLevel = skills.filter((skill) => !skill.proficiencyLevel).length;
  const activeGoals = goals.filter((goal) => goal.status === "LEARNING").length;
  const gapGoals = gaps.filter((gap) => goals.some((goal) => goal.skillName.toLowerCase() === gap.skill.toLowerCase())).length;

  const items = [
    {
      label: "Review imported skills",
      help: skills.length > 0 ? `${skills.length} skills in your Profile` : "Add at least one skill to start",
      done: skills.length > 0,
    },
    {
      label: "Fill missing proficiency",
      help: missingLevel === 0 ? "Every skill has a level" : `${missingLevel} skill${missingLevel === 1 ? "" : "s"} still need a level`,
      done: skills.length > 0 && missingLevel === 0,
    },
    {
      label: "Choose active learning goals",
      help: activeGoals > 0 ? `${activeGoals} active now` : "Move 1–3 priorities into Learning",
      done: activeGoals > 0,
    },
    {
      label: "Track journey gaps",
      help: activePath ? `${gapGoals}/${gaps.length} gaps queued or covered` : "Create a journey to unlock path-specific gaps",
      done: !activePath ? false : gaps.length === 0 || gapGoals > 0,
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">First-time setup</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--mute)]">
            Follow these steps to turn a raw skill list into useful career guidance.
          </p>
        </div>
        <span className="mono shrink-0 rounded-full bg-[var(--bg-sub)] px-2 py-1 text-[10px] text-[var(--mute-3)]">
          {items.filter((item) => item.done).length}/{items.length} done
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--line)] bg-[var(--bg-sub)] p-3">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                style={{
                  background: item.done ? "var(--accent)" : "var(--surface)",
                  color: item.done ? "white" : "var(--mute-3)",
                  border: item.done ? "none" : "1px solid var(--line)",
                }}
              >
                {item.done ? "✓" : ""}
              </span>
              <span className="text-xs font-medium text-[var(--ink)]">{item.label}</span>
            </div>
            <p className="pl-6 text-[11px] leading-relaxed text-[var(--mute)]">{item.help}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillsStudio({
  initialSkills,
  initialGoals,
  activePath,
}: SkillsStudioProps) {
  const [skills, setSkills] = useState<UserSkill[]>(initialSkills);
  const [goals, setGoals] = useState<UserLearningGoal[]>(initialGoals);

  function upsertGoal(goal: UserLearningGoal) {
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === goal.id);
      if (exists) return prev.map((g) => (g.id === goal.id ? goal : g));
      const sameName = prev.some((g) => g.skillName.toLowerCase() === goal.skillName.toLowerCase());
      if (sameName) return prev.map((g) => (g.skillName.toLowerCase() === goal.skillName.toLowerCase() ? goal : g));
      return [...prev, goal];
    });
  }

  const stats = useMemo(() => {
    const gaps = activePath?.details?.skillGaps ?? [];
    const covered = gaps.filter((gap) => {
      const s = skills.find((sk) => sk.name.toLowerCase() === gap.skill.toLowerCase());
      return s && (s.proficiencyLevel === "advanced" || s.proficiencyLevel === "expert");
    }).length;
    const learning = goals.filter((g) => g.status === "LEARNING").length;
    const missingLevel = skills.filter((s) => !s.proficiencyLevel).length;
    return { total: skills.length, covered, totalGaps: gaps.length, learning, missingLevel };
  }, [skills, goals, activePath]);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Skills" />
      <div className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--ink)]">Skills</h1>
            <PageHelpButton help={DASHBOARD_PAGE_HELP.skills} label="Skills" />
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--mute)]">
            Keep your Profile accurate, decide what you&apos;re building next, and understand which skills matter for your current journey.
          </p>
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          <StatCard value={stats.total} label="skills" />
          {stats.totalGaps > 0 && <StatCard value={`${stats.covered}/${stats.totalGaps}`} label="gaps covered" tone="var(--accent)" />}
          <StatCard value={stats.learning} label="learning" />
          <StatCard value={stats.missingLevel} label="need level" />
        </div>
      </div>

      <SetupChecklist skills={skills} goals={goals} activePath={activePath} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <SkillInventory skills={skills} onChange={setSkills} />

        <div className="flex flex-col gap-6">
          <SkillGap
            activePath={activePath}
            skills={skills}
            goals={goals}
            onGoalAdded={upsertGoal}
          />
          <LearningGoals
            goals={goals}
            skills={skills}
            onChange={setGoals}
            onSkillAdded={(skill) => setSkills((prev) => [...prev, skill])}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
