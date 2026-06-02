"use client";

import { useMemo, useState } from "react";
import type { CareerJourney, UserSkill, UserLearningGoal } from "@kursa/types";

import { SkillInventory } from "./skill-inventory";
import { LearningGoals } from "./learning-goals";
import { SkillGap } from "./skill-gap";

interface SkillsStudioProps {
  initialSkills: UserSkill[];
  initialGoals: UserLearningGoal[];
  activePath: CareerJourney | null;
}

export function SkillsStudio({
  initialSkills,
  initialGoals,
  activePath,
}: SkillsStudioProps) {
  const [skills, setSkills] = useState<UserSkill[]>(initialSkills);
  const [goals, setGoals] = useState<UserLearningGoal[]>(initialGoals);

  const stats = useMemo(() => {
    const gaps = activePath?.details?.skillGaps ?? [];
    const covered = gaps.filter((gap) => {
      const s = skills.find(
        (sk) => sk.name.toLowerCase() === gap.skill.toLowerCase(),
      );
      return (
        s &&
        (s.proficiencyLevel === "advanced" || s.proficiencyLevel === "expert")
      );
    }).length;
    const learning = goals.filter((g) => g.status === "LEARNING").length;
    return { total: skills.length, covered, totalGaps: gaps.length, learning };
  }, [skills, goals, activePath]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">Skills</h1>
          <p className="text-sm text-[var(--mute)]">
            What you know, what you&apos;re learning, and what&apos;s standing between you and your next role.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-stretch gap-2">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-center">
            <div className="text-lg font-semibold leading-none text-[var(--ink)]">
              {stats.total}
            </div>
            <div className="mono mt-0.5 text-[10px] text-[var(--mute)]">
              skills
            </div>
          </div>

          {stats.totalGaps > 0 && (
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-center">
              <div className="text-lg font-semibold leading-none" style={{ color: "var(--accent)" }}>
                {stats.covered}
                <span className="text-xs font-normal text-[var(--mute)]">
                  /{stats.totalGaps}
                </span>
              </div>
              <div className="mono mt-0.5 text-[10px] text-[var(--mute)]">
                gaps covered
              </div>
            </div>
          )}

          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-center">
            <div className="text-lg font-semibold leading-none text-[var(--ink)]">
              {stats.learning}
            </div>
            <div className="mono mt-0.5 text-[10px] text-[var(--mute)]">
              learning
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: inventory */}
        <SkillInventory skills={skills} onChange={setSkills} />

        {/* Right: gap analysis + learning queue */}
        <div className="flex flex-col gap-6">
          <SkillGap
            activePath={activePath}
            skills={skills}
            goals={goals}
            onGoalAdded={(goal) => setGoals((prev) => [...prev, goal])}
          />
          <LearningGoals goals={goals} onChange={setGoals} />
        </div>
      </div>
    </div>
  );
}
