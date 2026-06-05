"use client";

import { useState } from "react";
import type { CareerJourney, UserLearningGoal, UserSkill } from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import { LearningGoals } from "@/components/dashboard/skills/learning-goals";
import { SkillGap } from "@/components/dashboard/skills/skill-gap";

interface LearningPageProps {
  initialGoals: UserLearningGoal[];
  initialSkills: UserSkill[];
  activePath: CareerJourney | null;
}

export function LearningPage({ initialGoals, initialSkills, activePath }: LearningPageProps) {
  const [goals, setGoals] = useState<UserLearningGoal[]>(initialGoals);
  const [skills, setSkills] = useState<UserSkill[]>(initialSkills);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader pageTitle="Learning" breadcrumb="Workspace" />

      {activePath && (
        <SkillGap
          activePath={activePath}
          skills={skills}
          goals={goals}
          onGoalAdded={(goal) => setGoals((prev) => [...prev, goal])}
        />
      )}

      <LearningGoals
        goals={goals}
        skills={skills}
        onChange={setGoals}
        onSkillAdded={(skill) => setSkills((prev) => [...prev, skill])}
      />
    </div>
  );
}
