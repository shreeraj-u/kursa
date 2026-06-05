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
import { openai } from "../lib/openai.js";
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

  const { getGitHubSnapshot } = await import("./github-sync.service.js");
  const githubSnapshot = await getGitHubSnapshot(userId).catch(() => null);
  if (githubSnapshot) {
    const boost = githubSnapshot.workPatterns.pushVelocity === "accelerating" ? 8 : 0;
    for (const { language } of githubSnapshot.workPatterns.languageMix.slice(0, 6)) {
      if (skillNames.has(language.toLowerCase())) continue;
      recommendations.push({
        skillName: language,
        reason: `Active on GitHub (${githubSnapshot.workPatterns.pushVelocity} velocity)`,
        priority: 68 + boost,
        source: "github",
        cta: "add_skill",
      });
    }
    for (const fw of githubSnapshot.workPatterns.frameworkSignals.slice(0, 4)) {
      if (skillNames.has(fw.toLowerCase())) continue;
      recommendations.push({
        skillName: fw,
        reason: "Detected in your GitHub READMEs and repo metadata",
        priority: 65 + boost,
        source: "github",
        cta: "add_skill",
      });
    }
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

type InterpretAction = {
  skillId: string | null;
  name: string;
  action: "add" | "update";
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert" | null;
  confidenceRating: number | null;
  category: "technical" | "soft" | "tool";
};

export async function interpretSkillMessage(
  userId: string,
  message: string,
): Promise<{ actions: Array<{ action: "added" | "updated"; skill: unknown }> }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { skills: { orderBy: [{ category: "asc" }, { name: "asc" }] } },
  });

  const existingSkills = profile?.skills ?? [];
  const skillList = existingSkills
    .map((s) => `- id:${s.id} name:"${s.name}" category:${s.category} proficiency:${s.proficiencyLevel ?? "none"} confidence:${s.confidenceRating ?? "none"}`)
    .join("\n");

  const systemPrompt = `You are a skill-level interpreter for a career advisor app. The user will describe how their skills have changed or ask to add new skills. You must return a JSON object with an "actions" array.

User's current skills:
${skillList || "(no skills yet)"}

Each action must be:
- action "update": for an existing skill (match by name, case-insensitive). Set skillId to the matching id. Infer proficiencyLevel and confidenceRating from the user's description.
- action "add": for a new skill not in the list. Set skillId to null. Infer category, proficiencyLevel, and confidenceRating.

proficiencyLevel must be one of: "beginner", "intermediate", "advanced", "expert", or null if undetectable.
confidenceRating must be an integer 1-5, or null if undetectable.
category must be one of: "technical", "soft", "tool".

Return ONLY valid JSON: { "actions": [ { "skillId": string|null, "name": string, "action": "add"|"update", "proficiencyLevel": string|null, "confidenceRating": number|null, "category": string } ] }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });

  const raw = completion.choices[0]?.message.content ?? "{}";
  let parsed: { actions?: InterpretAction[] };
  try {
    parsed = JSON.parse(raw) as { actions?: InterpretAction[] };
  } catch {
    return { actions: [] };
  }

  const interpretActions = Array.isArray(parsed.actions) ? parsed.actions : [];
  const results: Array<{ action: "added" | "updated"; skill: unknown }> = [];

  for (const item of interpretActions) {
    try {
      if (item.action === "update" && item.skillId) {
        const patch: Record<string, unknown> = {};
        if (item.proficiencyLevel) patch.proficiencyLevel = item.proficiencyLevel;
        if (item.confidenceRating != null) patch.confidenceRating = item.confidenceRating;
        const skill = await skillsService.updateSkill(userId, item.skillId, patch);
        results.push({ action: "updated", skill });
      } else if (item.action === "add") {
        const skill = await skillsService.createSkill(userId, {
          name: item.name,
          category: item.category ?? "technical",
          proficiencyLevel: item.proficiencyLevel ?? undefined,
          confidenceRating: item.confidenceRating ?? undefined,
          source: "inferred_chat",
        });
        results.push({ action: "added", skill });
      }
    } catch {
      // skip failed individual actions
    }
  }

  return { actions: results };
}
