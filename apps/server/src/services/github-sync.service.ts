import prisma from "@kursa/db";
import type {
  GitHubLanguageMix,
  GitHubNormalizedSnapshot,
  GitHubRepo,
  GitHubRepoEnriched,
  GitHubRepoPreview,
  GitHubStatusResponse,
  GitHubSyncConfirmRequest,
  GitHubSyncDelta,
  GitHubSyncPreviewResponse,
  GitHubSyncSummaryResponse,
  GitHubWorkPatterns,
} from "@kursa/types";

import {
  computeSyncDelta,
  computeWorkPatterns,
  deltaHasMaterialChange,
  repoToEnriched,
} from "../compute/github-patterns.compute.js";
import { extractGitHubProfileIntelligence } from "../lib/ai/github-profile.extract.js";
import { upsertProjectProposal } from "./project-proposal.service.js";
import { upsertSkillProposal } from "./skills.service.js";

const GITHUB_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
});

export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

type GitHubUser = {
  login: string;
  html_url?: string;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  blog?: string | null;
  avatar_url?: string | null;
};

export async function fetchGitHubUser(token: string): Promise<GitHubUser | null> {
  const res = await fetch("https://api.github.com/user", { headers: GITHUB_HEADERS(token) });
  if (!res.ok) return null;
  return res.json() as Promise<GitHubUser>;
}

export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?type=owner&sort=updated&per_page=100&page=${page}`,
      { headers: GITHUB_HEADERS(token) },
    );
    if (!res.ok) break;

    const batch = (await res.json()) as GitHubRepo[];
    if (batch.length === 0) break;

    allRepos.push(...batch.filter((r) => !r.fork));
    if (batch.length < 100) break;
    page++;
  }

  return allRepos;
}

async function fetchReadme(token: string, owner: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { ...GITHUB_HEADERS(token), Accept: "application/vnd.github.raw" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 4000) || null;
  } catch {
    return null;
  }
}

async function fetchRepoLanguages(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubLanguageMix[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: GITHUB_HEADERS(token),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, number>;
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(data)
      .map(([language, bytes]) => ({ language, weight: Math.round((bytes / total) * 100) / 100 }))
      .sort((a, b) => b.weight - a.weight);
  } catch {
    return [];
  }
}

async function fetchCommitActivity(token: string, owner: string, repo: string): Promise<number[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`, {
      headers: GITHUB_HEADERS(token),
    });
    if (!res.ok) return [];
    const weeks = (await res.json()) as Array<{ days: number[] }>;
    const last4 = weeks.slice(-4);
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    for (const week of last4) {
      week.days.forEach((n, i) => { buckets[i] = (buckets[i] ?? 0) + n; });
    }
    return buckets;
  } catch {
    return [];
  }
}

export async function buildGitHubSnapshot(token: string): Promise<GitHubNormalizedSnapshot | null> {
  const user = await fetchGitHubUser(token);
  if (!user?.login) return null;

  const repos = await fetchUserRepos(token);
  const sorted = [...repos].sort(
    (a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
  );

  const profileReadme = await fetchReadme(token, user.login, user.login);

  const enriched: GitHubRepoEnriched[] = [];
  for (const repo of sorted) {
    const entry = repoToEnriched(repo);
    enriched.push(entry);
  }

  for (const repo of sorted.slice(0, 8)) {
    const idx = enriched.findIndex((r) => r.id === repo.id);
    if (idx < 0) continue;
    const readme = await fetchReadme(token, user.login, repo.name);
    enriched[idx] = { ...enriched[idx]!, readmeExcerpt: readme };
  }

  for (const repo of sorted.slice(0, 5)) {
    const idx = enriched.findIndex((r) => r.id === repo.id);
    if (idx < 0) continue;
    const languages = await fetchRepoLanguages(token, user.login, repo.name);
    enriched[idx] = { ...enriched[idx]!, languages };
  }

  const activeForRhythm = sorted.slice(0, 3);
  const rhythmBuckets: number[] = [];
  for (const repo of activeForRhythm) {
    const buckets = await fetchCommitActivity(token, user.login, repo.name);
    buckets.forEach((n, i) => { rhythmBuckets[i] = (rhythmBuckets[i] ?? 0) + n; });
  }

  const workPatterns = computeWorkPatterns(enriched, profileReadme, rhythmBuckets.length ? rhythmBuckets : undefined);

  return {
    profile: {
      login: user.login,
      bio: user.bio ?? null,
      company: user.company ?? null,
      location: user.location ?? null,
      blog: user.blog ?? null,
      avatarUrl: user.avatar_url ?? null,
    },
    profileReadme,
    repos: enriched,
    workPatterns,
  };
}

function getPreviousSnapshot(normalized: unknown): GitHubNormalizedSnapshot | null {
  if (!normalized || typeof normalized !== "object") return null;
  return normalized as GitHubNormalizedSnapshot;
}

async function applyExtractedProposals(
  userId: string,
  snapshot: GitHubNormalizedSnapshot,
  repos: GitHubRepo[],
): Promise<{ skills: number; projects: number }> {
  const extracted = await extractGitHubProfileIntelligence(snapshot);
  let skills = 0;
  let projects = 0;

  for (const skill of extracted.skills.slice(0, 15)) {
    const row = await upsertSkillProposal(userId, {
      canonicalName: skill.name,
      displayName: skill.name,
      category: skill.category,
      proposalType: "add",
      suggestedConfidence: skill.confidence ?? 3,
      source: "github",
      evidence: skill.evidence,
    });
    if (row) skills++;
  }

  for (const proj of extracted.projects.slice(0, 10)) {
    const repo = repos.find((r) => r.name === proj.title || r.html_url === proj.url);
    const row = await upsertProjectProposal(userId, {
      title: proj.title,
      description: proj.description ?? repo?.description ?? null,
      url: proj.url ?? repo?.html_url ?? null,
      outcomes: repo
        ? {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            primaryLanguage: repo.language,
            topics: repo.topics,
          }
        : null,
      startDate: repo ? new Date(repo.created_at) : null,
      endDate: repo ? new Date(repo.pushed_at) : null,
      evidence: proj.evidence,
      sourceRef: repo ? { repoId: repo.id, repoFullName: `${snapshot.profile.login}/${repo.name}` } : undefined,
    });
    if (row) projects++;
  }

  return { skills, projects };
}

async function emitGitHubActivityEvent(
  userId: string,
  delta: GitHubSyncDelta,
  workPatterns: GitHubWorkPatterns,
  username: string,
  skillsProposed: number,
  projectsProposed: number,
): Promise<void> {
  if (!deltaHasMaterialChange(delta)) return;

  const { ingestEvent } = await import("./events.service.js");
  const parts: string[] = [];
  if (delta.newRepos.length) parts.push(`${delta.newRepos.length} new repo${delta.newRepos.length === 1 ? "" : "s"}`);
  if (delta.newlyActiveRepos.length) parts.push(`${delta.newlyActiveRepos.length} newly active`);
  if (delta.significantPushes.length) parts.push(`${delta.significantPushes.length} updated`);

  await ingestEvent(userId, {
    type: "github_activity",
    source: "system",
    body: parts.length
      ? `GitHub activity: ${parts.join(", ")}.`
      : `GitHub work patterns updated (${workPatterns.pushVelocity}).`,
    structured: {
      type: "github_daily_delta",
      username,
      newRepos: delta.newRepos,
      newlyActiveRepos: delta.newlyActiveRepos,
      languageShifts: delta.languageShifts,
      pushVelocity: workPatterns.pushVelocity,
      primaryLanguages: workPatterns.languageMix.slice(0, 5).map((l) => l.language),
      topTopics: workPatterns.topTopics.slice(0, 8),
      skillsProposed,
      projectsProposed,
    },
    skipDelta: false,
    skipDistill: false,
    skipEnrich: false,
  });

}

export async function runGitHubIngest(userId: string): Promise<{ ok: boolean; error?: string }> {
  const token = await getGitHubToken(userId);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return { ok: false, error: "Profile not found" };

  if (!token) {
    await prisma.gitHubSyncRun.create({
      data: { profileId: profile.id, status: "no_token", delta: {}, workPatterns: {} },
    });
    return { ok: false, error: "GitHub not connected" };
  }

  await prisma.gitHubProfileSnapshot.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      githubUsername: "",
      githubUrl: "",
      status: "pending",
      normalized: {},
    },
    update: { status: "pending" },
  });

  try {
    const snapshot = await buildGitHubSnapshot(token);
    if (!snapshot) {
      await prisma.gitHubProfileSnapshot.update({
        where: { profileId: profile.id },
        data: { status: "failed", lastError: "Could not fetch GitHub user" },
      });
      return { ok: false, error: "Could not fetch GitHub user" };
    }

    const githubUrl = `https://github.com/${snapshot.profile.login}`;

    const existing = await prisma.gitHubProfileSnapshot.findUnique({
      where: { profileId: profile.id },
    });
    const previous = getPreviousSnapshot(existing?.normalized);
    const lastRun = await prisma.gitHubSyncRun.findFirst({
      where: { profileId: profile.id, status: "complete" },
      orderBy: { ranAt: "desc" },
    });
    const prevPatterns = (lastRun?.workPatterns ?? null) as GitHubWorkPatterns | null;

    const delta = computeSyncDelta(previous, snapshot, prevPatterns?.pushVelocity ?? null);

    const { skills: skillsProposed, projects: projectsProposed } = await applyExtractedProposals(
      userId,
      snapshot,
      snapshot.repos,
    );

    await prisma.$transaction(async (tx) => {
      await tx.gitHubProfileSnapshot.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          githubUsername: snapshot.profile.login,
          githubUrl,
          status: "complete",
          normalized: snapshot as object,
          lastIngestedAt: new Date(),
          lastError: null,
        },
        update: {
          githubUsername: snapshot.profile.login,
          githubUrl,
          status: "complete",
          normalized: snapshot as object,
          lastIngestedAt: new Date(),
          lastError: null,
        },
      });

      await tx.gitHubSyncRun.create({
        data: {
          profileId: profile.id,
          status: "complete",
          delta: delta as object,
          workPatterns: snapshot.workPatterns as object,
        },
      });

      await tx.socialLink.upsert({
        where: { profileId_platform: { profileId: profile.id, platform: "github" } },
        create: { profileId: profile.id, platform: "github", url: githubUrl },
        update: { url: githubUrl },
      });
    });

    await emitGitHubActivityEvent(
      userId,
      delta,
      snapshot.workPatterns,
      snapshot.profile.login,
      skillsProposed,
      projectsProposed,
    );

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "GitHub ingest failed";
    await prisma.gitHubProfileSnapshot.update({
      where: { profileId: profile.id },
      data: { status: "failed", lastError: message },
    }).catch(() => undefined);
    await prisma.gitHubSyncRun.create({
      data: { profileId: profile.id, status: "failed", delta: {}, workPatterns: {} },
    }).catch(() => undefined);
    return { ok: false, error: message };
  }
}

export async function getGitHubStatus(userId: string): Promise<GitHubStatusResponse> {
  const token = await getGitHubToken(userId);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile || !token) {
    return {
      connected: false,
      username: null,
      githubUrl: null,
      snapshotStatus: "none",
      lastIngestedAt: null,
      pushVelocity: null,
      pendingSkillProposals: 0,
      pendingProjectProposals: 0,
      lastError: null,
    };
  }

  const [snapshot, skillCount, projectCount] = await Promise.all([
    prisma.gitHubProfileSnapshot.findUnique({ where: { profileId: profile.id } }),
    prisma.skillProposal.count({ where: { profileId: profile.id, status: "pending", source: "github" } }),
    prisma.projectProposal.count({ where: { profileId: profile.id, status: "pending" } }),
  ]);

  const normalized = snapshot?.normalized as GitHubNormalizedSnapshot | undefined;

  return {
    connected: true,
    username: snapshot?.githubUsername ?? normalized?.profile.login ?? null,
    githubUrl: snapshot?.githubUrl ?? null,
    snapshotStatus: (snapshot?.status as GitHubStatusResponse["snapshotStatus"]) ?? "none",
    lastIngestedAt: snapshot?.lastIngestedAt?.toISOString() ?? null,
    pushVelocity: normalized?.workPatterns.pushVelocity ?? null,
    pendingSkillProposals: skillCount,
    pendingProjectProposals: projectCount,
    lastError: snapshot?.lastError ?? null,
  };
}

export async function getGitHubSnapshot(userId: string): Promise<GitHubNormalizedSnapshot | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;
  const row = await prisma.gitHubProfileSnapshot.findUnique({ where: { profileId: profile.id } });
  if (!row || row.status !== "complete") return null;
  return row.normalized as unknown as GitHubNormalizedSnapshot;
}

const ingestInFlight = new Map<string, Promise<{ ok: boolean; error?: string }>>();

export function scheduleGitHubIngest(userId: string): void {
  if (ingestInFlight.has(userId)) return;
  const promise = runGitHubIngest(userId).finally(() => ingestInFlight.delete(userId));
  ingestInFlight.set(userId, promise);
  void promise;
}

export async function buildPreview(
  userId: string,
  repos: GitHubRepo[],
): Promise<GitHubSyncPreviewResponse> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      projects: { select: { id: true, title: true, url: true } },
      githubProfileSnapshot: { select: { status: true, lastIngestedAt: true } },
    },
  });

  if (!profile) return { repos: [], connected: true };

  const pendingProposals = await prisma.projectProposal.findMany({
    where: { profileId: profile.id, status: "pending" },
    select: { sourceRef: true, title: true },
  });

  const existingProjects = profile.projects;

  const previews: GitHubRepoPreview[] = repos.map((repo) => {
    const urlMatch = existingProjects.find((p) => p.url && p.url === repo.html_url);
    if (urlMatch) {
      return { repo, status: "existing", existingProjectId: urlMatch.id };
    }

    const hasProposal = pendingProposals.some((p) => {
      const ref = p.sourceRef as { repoId?: number } | null;
      return ref?.repoId === repo.id || p.title.toLowerCase() === repo.name.toLowerCase();
    });
    if (hasProposal) {
      return { repo, status: "existing" };
    }

    const normalizedRepoName = repo.name.toLowerCase().replace(/[-_]/g, " ");
    const nameMatch = existingProjects.find((p) => {
      const normalizedTitle = p.title.toLowerCase().replace(/[-_]/g, " ");
      return !p.url && normalizedTitle === normalizedRepoName;
    });
    if (nameMatch) {
      return { repo, status: "merge_candidate", existingProjectId: nameMatch.id };
    }

    return { repo, status: "new" };
  });

  return {
    repos: previews,
    connected: true,
    snapshotStatus: (profile.githubProfileSnapshot?.status as GitHubSyncPreviewResponse["snapshotStatus"]) ?? "none",
    lastIngestedAt: profile.githubProfileSnapshot?.lastIngestedAt?.toISOString() ?? null,
  };
}

export async function persistSync(
  userId: string,
  token: string,
  request: GitHubSyncConfirmRequest,
  allRepos: GitHubRepo[],
): Promise<GitHubSyncSummaryResponse> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found");

  const ghUser = await fetchGitHubUser(token);
  const githubUrl = ghUser?.html_url ?? (ghUser?.login ? `https://github.com/${ghUser.login}` : undefined);

  const acceptedProjects: string[] = [];
  const acceptedSkills: string[] = [];

  if (request.acceptedProposalIds?.length) {
    const { acceptProjectProposal } = await import("./project-proposal.service.js");
    for (const id of request.acceptedProposalIds) {
      try {
        const result = await acceptProjectProposal(userId, id);
        acceptedProjects.push(result.title);
      } catch {
        // skip invalid ids
      }
    }
  } else {
    const repoById = new Map(allRepos.map((r) => [r.id, r]));
    const { acceptProjectProposal, listProjectProposals } = await import("./project-proposal.service.js");
    const { data: proposals } = await listProjectProposals(userId, "pending", 50);

    for (const repoId of request.selectedRepoIds) {
      const repo = repoById.get(repoId);
      if (!repo) continue;
      const proposal = proposals.find((p) => {
        const ref = (p as { sourceRef?: { repoId?: number } }).sourceRef;
        return ref?.repoId === repoId || p.title.toLowerCase() === repo.name.toLowerCase();
      });
      if (proposal) {
        const result = await acceptProjectProposal(userId, proposal.id);
        acceptedProjects.push(result.title);
      }
    }

    for (const { repoId, projectId } of request.mergeRepoIds) {
      const repo = repoById.get(repoId);
      if (!repo) continue;
      await prisma.project.update({
        where: { id: projectId },
        data: {
          url: repo.html_url,
          startDate: new Date(repo.created_at),
          endDate: new Date(repo.pushed_at),
          outcomes: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            primaryLanguage: repo.language,
            topics: repo.topics,
          },
        },
      });
      acceptedProjects.push(repo.name);
    }
  }

  if (githubUrl) {
    await prisma.socialLink.upsert({
      where: { profileId_platform: { profileId: profile.id, platform: "github" } },
      create: { profileId: profile.id, platform: "github", url: githubUrl },
      update: { url: githubUrl },
    });
  }

  const summary: GitHubSyncSummaryResponse = {
    imported: acceptedProjects.length,
    merged: request.mergeRepoIds?.length ?? 0,
    skills: acceptedSkills,
    projects: acceptedProjects,
    ...(githubUrl ? { githubUrl } : {}),
  };

  const { ingestEvent } = await import("./events.service.js");
  await ingestEvent(userId, {
    type: "github_sync",
    source: "system",
    body: `Accepted ${summary.imported} GitHub project${summary.imported === 1 ? "" : "s"} to your profile.`,
    structured: {
      type: "github_sync",
      imported: summary.imported,
      merged: summary.merged,
      skills: summary.skills,
      projects: summary.projects,
      githubUrl: summary.githubUrl,
      syncedAt: new Date().toISOString(),
    },
    skipDelta: false,
    skipDistill: false,
    skipEnrich: false,
  });

  return summary;
}

export async function runGitHubDailySync(): Promise<void> {
  const accounts = await prisma.account.findMany({
    where: { providerId: "github", accessToken: { not: null } },
    select: { userId: true },
    take: 500,
  });

  for (let i = 0; i < accounts.length; i++) {
    const { userId } = accounts[i]!;
    try {
      await runGitHubIngest(userId);
    } catch (err) {
      console.error("[github-daily-sync] failed for", userId, err);
    }
    if ((i + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
