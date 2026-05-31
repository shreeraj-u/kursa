"use client";

import { useState } from "react";
import type { UserSkill, UserLearningGoal } from "@kursa/types";

import { SkillInventory } from "./skill-inventory";
import { LearningGoals } from "./learning-goals";

interface SkillsStudioProps {
  initialSkills: UserSkill[];
  initialGoals: UserLearningGoal[];
}

export function SkillsStudio({ initialSkills, initialGoals }: SkillsStudioProps) {
  const [skills, setSkills] = useState<UserSkill[]>(initialSkills);
  const [goals, setGoals] = useState<UserLearningGoal[]>(initialGoals);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--ink)]">Skills</h1>
        <p className="text-sm text-[var(--mute)]">
          Maintain your skill inventory and track what you&apos;re building.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: inventory + learning goals */}
        <div className="flex flex-col gap-6">
          <SkillInventory skills={skills} onChange={setSkills} />
          <LearningGoals goals={goals} onChange={setGoals} />
        </div>

        {/* Right: reserved slot for the skill-gap analysis (gap.tsx) */}
        <div className="min-h-[160px] rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="mb-1 text-sm font-semibold text-[var(--ink)]">
            Gap to chosen path
          </div>
          <p className="text-sm text-[var(--mute)]">
            Skill-gap analysis against your active career path appears here.
          </p>
        </div>
      </div>
    </div>
  );
}
