import prisma from "@kursa/db";
import type { SkillRecommendation, SkillsOverviewResponse } from "@kursa/types";

import { computeMarketGaps } from "../compute/gap-analysis.compute.js";
import {
  computeSkillsProfileCompleteness,
  extractMarketSkillsFromTitles,
  extractMilestoneSkills,
  extractProfileSkillsFromWorkHistory,
  isSkillStale,
  mergeSkillRecommendations,
  parsePathSkillGaps,
} from "../compute/skills-intelligence.compute.js";
import { assembleAdvisorContext } from "../lib/advisor-context.js";
import { formatLearningGoalLabel } from "../lib/learning-goal-label.js";
import { getMarketContextForUser } from "./market.service.js";
import * as skillsService from "./skills.service.js";

export async function getSkillsOverview(userId: string): Promise<SkillsOverviewResponse | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      skills: { orderBy: [{ category: "asc" }, { name: "asc" }] },
      learningGoals: { orderBy: { createdAt: "desc" } },
      careerPaths: { where: { isActive: true }, take: 1 },
      workHistories: {
        select: { roleTitle: true, outcomes: true },
        orderBy: { startDate: "desc" },
        take: 8,
      },
    },
  });

  if (!profile) return null;

  const [proposalsResult, context, marketContext] = await Promise.all([
    skillsService.listSkillProposals(userId, "pending", 20),
    assembleAdvisorContext(userId, "journal").catch(() => null),
    getMarketContextForUser(userId).catch(() => null),
  ]);

  const skillNames = new Set(profile.skills.map((s) => s.name.toLowerCase()));
  const recommendations: SkillRecommendation[] = [];

  if (marketContext?.gaps?.length) {
    for (const gap of marketContext.gaps.filter((g) => g.gapType === "missing")) {
      if (skillNames.has(gap.skill.toLowerCase())) continue;
      recommendations.push({
        skillName: gap.skill,
        reason: `Appears in ${gap.marketFrequency}% of matching job listings`,
        priority: 70 + Math.min(gap.marketFrequency, 25),
        source: "market",
        cta: "add_skill",
      });
    }
  } else if (marketContext?.sampleRoles?.length) {
    const marketSkills = extractMarketSkillsFromTitles(
      marketContext.sampleRoles.map((r) => r.title),
    );
    const profileInput = {
      bio: profile.bio,
      targetRole: profile.targetRole,
      location: profile.location,
      yearsOfExperience: profile.yearsOfExperience,
      aspirations: profile.aspirations,
      careerTrajectory: profile.careerTrajectory,
      skills: profile.skills.map((s) => ({
        name: s.name,
        confidenceRating: s.confidenceRating,
        lastUsedDate: s.lastUsedDate,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      workHistories: [],
      learningGoals: profile.learningGoals.map((g) => ({
        skillName: g.skillName,
        deadline: g.deadline,
        status: g.status,
      })),
      jobApplications: [],
      socialLinks: [],
    };
    const gaps = computeMarketGaps(profileInput, marketSkills);

    for (const gap of gaps.filter((g) => g.gapType === "missing")) {
      recommendations.push({
        skillName: gap.skill,
        reason: `Appears in ${gap.marketFrequency}% of matching job listings`,
        priority: 70 + Math.min(gap.marketFrequency, 25),
        source: "market",
        cta: "add_skill",
      });
    }
  }

  const activePath = profile.careerPaths[0];
  if (activePath) {
    const pathGaps = parsePathSkillGaps(
      activePath.details && typeof activePath.details === "object"
        ? (activePath.details as { skillGaps?: unknown }).skillGaps
        : [],
    );
    for (const gap of pathGaps) {
      if (skillNames.has(gap.skill.toLowerCase())) continue;
      const priority =
        gap.priority === "high" ? 88 : gap.priority === "low" ? 78 : 82;
      recommendations.push({
        skillName: gap.skill,
        reason: gap.whyItMatters || `On your active path: ${activePath.title}`,
        priority,
        source: "path",
        cta: "add_skill",
      });
    }

    for (const skill of extractMilestoneSkills(activePath.milestones)) {
      if (skillNames.has(skill.toLowerCase())) continue;
      recommendations.push({
        skillName: skill,
        reason: `Required on your next milestone for ${activePath.title}`,
        priority: 80,
        source: "path",
        cta: "add_skill",
      });
    }
  }

  for (const skill of extractProfileSkillsFromWorkHistory(
    profile.workHistories.map((w) => ({
      roleTitle: w.roleTitle,
      outcomes:
        typeof w.outcomes === "string"
          ? w.outcomes
          : w.outcomes != null
            ? JSON.stringify(w.outcomes)
            : "",
    })),
  )) {
    if (skillNames.has(skill.toLowerCase())) continue;
    recommendations.push({
      skillName: skill,
      reason: "Mentioned in your work history — add it to your skills inventory",
      priority: 62,
      source: "advisor",
      cta: "add_skill",
    });
  }

  for (const goal of profile.learningGoals) {
    if (goal.status === "COMPLETED") continue;
    const goalLabel = formatLearningGoalLabel(goal.skillName);
    if (skillNames.has(goalLabel.toLowerCase())) continue;
    const overdue = goal.deadline && goal.deadline < new Date();
    recommendations.push({
      skillName: goalLabel,
      reason: overdue ? "Learning goal is past deadline" : "Active learning goal on your profile",
      priority: overdue ? 90 : 75,
      source: "goal",
      cta: "start_learning",
    });
  }

  if (context) {
    for (const dormant of context.signals.dormantHighValueSkills.slice(0, 5)) {
      recommendations.push({
        skillName: dormant,
        reason: "High-confidence skill unused for 6+ months — refresh or showcase it",
        priority: 55,
        source: "advisor",
        cta: "add_skill",
      });
    }

    for (const mem of context.memories.filter((m) => m.category === "skill_evidence").slice(0, 5)) {
      const match = mem.fact.match(/\b(?:learning|using|building with)\s+([A-Za-z][A-Za-z0-9.+# ]{1,30})/i);
      const skillGuess = match?.[1]?.trim();
      if (!skillGuess || skillNames.has(skillGuess.toLowerCase())) continue;
      recommendations.push({
        skillName: skillGuess,
        reason: "Aria noted this from your activity",
        priority: 60,
        source: "memory",
        cta: "add_skill",
      });
    }
  }

  const merged = mergeSkillRecommendations(recommendations);
  const staleCount = profile.skills.filter((s) => isSkillStale(s.lastUsedDate)).length;
  const marketAligned = marketContext?.gaps?.filter((g) => g.gapType === "missing").length ?? 0;

  return {
    skills: profile.skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category as SkillsOverviewResponse["skills"][0]["category"],
      proficiencyLevel: s.proficiencyLevel as SkillsOverviewResponse["skills"][0]["proficiencyLevel"],
      confidenceRating: s.confidenceRating,
      lastUsedDate: s.lastUsedDate?.toISOString() ?? null,
      source: s.source as SkillsOverviewResponse["skills"][0]["source"],
      isStale: isSkillStale(s.lastUsedDate),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    recommendations: merged,
    proposals: proposalsResult.data,
    learningGoals: profile.learningGoals.map((g) => ({
      id: g.id,
      skillName: g.skillName,
      displayName: formatLearningGoalLabel(g.skillName),
      status: g.status,
      deadline: g.deadline?.toISOString() ?? null,
    })),
    signals: {
      profileCompleteness: computeSkillsProfileCompleteness(
        profile.skills.length,
        Boolean(profile.targetRole),
      ),
      staleCount,
      marketAlignedCount: Math.max(0, profile.skills.length - marketAligned),
      pendingProposalCount: proposalsResult.total,
    },
  };
}
