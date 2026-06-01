"use client";

import { useState } from "react";
import type { CareerPath, UserSkill, UserLearningGoal } from "@kursa/types";

import { SkillInventory } from "./skill-inventory";
import { LearningGoals } from "./learning-goals";
import { SkillGap } from "./skill-gap";

interface SkillsStudioProps {
  initialSkills: UserSkill[];
  initialGoals: UserLearningGoal[];
  activePath: CareerPath | null;
}

export function SkillsStudio({ initialSkills, initialGoals, activePath }: SkillsStudioProps) {
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

        {/* Right: skill-gap analysis against active career path */}
        <SkillGap
          activePath={activePath}
          skills={skills}
          goals={goals}
          onGoalAdded={(goal) => setGoals((prev) => [...prev, goal])}
        />
      </div>
    </div>
  );
}
