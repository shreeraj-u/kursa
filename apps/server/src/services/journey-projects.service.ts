import prisma from "@kursa/db";
import type {
  CareerJourney,
  JourneyActiveProject,
  JourneySuggestedProject,
} from "@kursa/types";

import type { GitHubNormalizedSnapshot } from "@kursa/types";

import { getGitHubSnapshot, getGitHubToken } from "./github-sync.service.js";

const MS_PER_DAY = 86400000;

function activityLabel(pushedAt: string): string {
  const days = (Date.now() - new Date(pushedAt).getTime()) / MS_PER_DAY;
  if (days < 7) return "Active this week";
  if (days < 30) return `Touched ${Math.round(days)}d ago`;
  return `Updated ${Math.round(days)}d ago`;
}

function matchMilestone(repoName: string, journey: CareerJourney | null): number | undefined {
  if (!journey) return undefined;
  const needle = repoName.toLowerCase();
  for (const m of journey.milestones) {
    const artifacts = m.proofArtifacts ?? [];
    if (artifacts.some((a) => a.toLowerCase().includes(needle))) return m.order;
    if (m.title.toLowerCase().includes(needle)) return m.order;
  }
  return undefined;
}

export async function buildActiveProjects(
  userId: string,
  journey: CareerJourney | null,
): Promise<{ projects: JourneyActiveProject[]; githubConnected: boolean }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      projects: {
        select: { id: true, title: true, url: true, endDate: true, outcomes: true },
        orderBy: { endDate: "desc" },
        take: 20,
      },
    },
  });

  const token = await getGitHubToken(userId);
  const githubConnected = Boolean(token);
  const snapshot = githubConnected ? await getGitHubSnapshot(userId) : null;
  const items: JourneyActiveProject[] = [];

  if (snapshot?.workPatterns.activeRepos.length) {
    for (const repo of snapshot.workPatterns.activeRepos.slice(0, 6)) {
      items.push({
        id: `github-${repo.name}`,
        source: "github",
        title: repo.name,
        url: repo.url,
        language: repo.language,
        topics: repo.topics,
        lastPushedAt: repo.pushedAt,
        activityLabel: activityLabel(repo.pushedAt),
        linkedMilestoneOrder: matchMilestone(repo.name, journey),
      });
    }
  }

  for (const p of profile?.projects ?? []) {
    const outcomes = p.outcomes as { primaryLanguage?: string; topics?: string[] } | null;
    const pushed = p.endDate?.toISOString() ?? new Date().toISOString();
    const duplicate = items.some(
      (i) => i.url && p.url && i.url.toLowerCase() === p.url.toLowerCase(),
    );
    if (duplicate) continue;
    items.push({
      id: p.id,
      source: "profile",
      title: p.title,
      url: p.url,
      language: outcomes?.primaryLanguage ?? null,
      topics: outcomes?.topics ?? [],
      lastPushedAt: pushed,
      activityLabel: p.endDate ? activityLabel(pushed) : "On your profile",
      linkedMilestoneOrder: matchMilestone(p.title, journey),
    });
  }

  items.sort(
    (a, b) => new Date(b.lastPushedAt).getTime() - new Date(a.lastPushedAt).getTime(),
  );

  return { projects: items.slice(0, 6), githubConnected };
}

export async function buildSuggestedProjects(
  userId: string,
  journey: CareerJourney | null,
): Promise<JourneySuggestedProject[]> {
  if (!journey) return [];

  const snapshot = await getGitHubSnapshot(userId);
  const gaps = journey.details?.skillGaps ?? [];
  const suggestions: JourneySuggestedProject[] = [];
  let idx = 0;

  for (const gap of gaps.filter((g) => g.priority === "high").slice(0, 2)) {
    const milestone = journey.milestones.find((m) => m.status !== "completed");
    suggestions.push({
      id: `suggest-gap-${idx++}`,
      title: `Build a project demonstrating ${gap.skill}`,
      rationale: gap.whyItMatters || `Close the ${gap.skill} gap on your journey.`,
      targetMilestoneOrder: milestone?.order,
      suggestedSkills: [gap.skill],
      effort: "medium",
      source: "journey",
    });
  }

  for (const m of journey.milestones.filter((x) => x.status === "in_progress" || x.status === "not_started").slice(0, 2)) {
    if (m.proofArtifacts?.length) {
      suggestions.push({
        id: `suggest-milestone-${idx++}`,
        title: `Ship proof for: ${m.title}`,
        rationale: m.firstStep || m.description,
        targetMilestoneOrder: m.order,
        suggestedSkills: m.requiredSkills.slice(0, 3),
        effort: "small",
        source: "journey",
      });
    }
  }

  if (snapshot?.workPatterns.frameworkSignals.length) {
    const fw = snapshot.workPatterns.frameworkSignals[0];
    const dormant = snapshot.workPatterns.dormantRepos[0];
    if (dormant && fw) {
      suggestions.push({
        id: `suggest-github-${idx++}`,
        title: `Revive or document ${dormant}`,
        rationale: `You have been focused on ${fw} recently — refreshing ${dormant} would show range and maintenance skills.`,
        suggestedSkills: [fw],
        effort: "small",
        source: "github_patterns",
      });
    }
  }

  if (snapshot?.workPatterns.pushVelocity === "accelerating" && snapshot.workPatterns.activeRepos[0]) {
    const top = snapshot.workPatterns.activeRepos[0];
    suggestions.push({
      id: `suggest-active-${idx++}`,
      title: `Polish and showcase ${top.name}`,
      rationale: `This is your most active repo. Add a strong README and outcomes to strengthen your portfolio for ${journey.title}.`,
      targetMilestoneOrder: matchMilestone(top.name, journey),
      suggestedSkills: top.language ? [top.language] : [],
      effort: "small",
      source: "github_patterns",
    });
  }

  return suggestions.slice(0, 5);
}

export function githubSliceFromSnapshot(snapshot: GitHubNormalizedSnapshot | null) {
  if (!snapshot) return null;
  return {
    username: snapshot.profile.login,
    lastActiveAt: snapshot.workPatterns.lastActiveAt,
    pushVelocity: snapshot.workPatterns.pushVelocity,
    activeRepoNames: snapshot.workPatterns.activeRepos.slice(0, 3).map((r) => r.name),
    primaryLanguages: snapshot.workPatterns.languageMix.slice(0, 5).map((l) => l.language),
    frameworkSignals: snapshot.workPatterns.frameworkSignals.slice(0, 8),
  };
}
