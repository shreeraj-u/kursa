import prisma from "@kursa/db";
import type {
  GitHubRepo,
  GitHubRepoPreview,
  GitHubSyncPreviewResponse,
  GitHubSyncConfirmRequest,
} from "@kursa/types";

export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

async function fetchGitHubUser(token: string): Promise<{ login: string } | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ login: string }>;
}

export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?type=owner&sort=updated&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
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

export async function buildPreview(
  userId: string,
  repos: GitHubRepo[]
): Promise<GitHubSyncPreviewResponse> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { projects: { select: { id: true, title: true, url: true } } },
  });

  if (!profile) return { repos: [], connected: true };

  const existingProjects = profile.projects;

  const previews: GitHubRepoPreview[] = repos.map((repo) => {
    const urlMatch = existingProjects.find((p) => p.url && p.url === repo.html_url);
    if (urlMatch) {
      return { repo, status: "existing", existingProjectId: urlMatch.id };
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

  return { repos: previews, connected: true };
}

export async function persistSync(
  userId: string,
  token: string,
  request: GitHubSyncConfirmRequest,
  allRepos: GitHubRepo[]
): Promise<{ imported: number; merged: number }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found");

  const ghUser = await fetchGitHubUser(token);
  const repoById = new Map(allRepos.map((r) => [r.id, r]));

  await prisma.$transaction(async (tx) => {
    for (const repoId of request.selectedRepoIds) {
      const repo = repoById.get(repoId);
      if (!repo) continue;

      const project = await tx.project.create({
        data: {
          profileId: profile.id,
          title: repo.name,
          description: repo.description ?? undefined,
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

      await upsertSkillsForRepo(tx, profile.id, project.id, repo);
    }

    for (const { repoId, projectId } of request.mergeRepoIds) {
      const repo = repoById.get(repoId);
      if (!repo) continue;

      await tx.project.update({
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

      await upsertSkillsForRepo(tx, profile.id, projectId, repo);
    }

    if (ghUser?.login) {
      await tx.socialLink.upsert({
        where: { profileId_platform: { profileId: profile.id, platform: "github" } },
        create: { profileId: profile.id, platform: "github", url: `https://github.com/${ghUser.login}` },
        update: { url: `https://github.com/${ghUser.login}` },
      });
    }
  });

  const { ingestEvent } = await import("./events.service.js");
  await ingestEvent(userId, {
    type: "github_sync",
    source: "system",
    body: `GitHub sync: imported ${request.selectedRepoIds.length} projects, merged ${request.mergeRepoIds.length}`,
    structured: {
      type: "github_sync",
      imported: request.selectedRepoIds.length,
      merged: request.mergeRepoIds.length,
      syncedAt: new Date().toISOString(),
    },
    skipDelta: true,
    skipDistill: true,
    skipEnrich: true,
  });

  return { imported: request.selectedRepoIds.length, merged: request.mergeRepoIds.length };
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function upsertSkillsForRepo(
  tx: TxClient,
  profileId: string,
  projectId: string,
  repo: GitHubRepo
): Promise<void> {
  const skillDefs: { name: string; category: "technical" | "tool" }[] = [];

  if (repo.language) {
    skillDefs.push({ name: repo.language, category: "technical" });
  }
  for (const topic of repo.topics) {
    skillDefs.push({ name: topic, category: "tool" });
  }

  for (const { name, category } of skillDefs) {
    const skill = await tx.skill.upsert({
      where: { profileId_name: { profileId, name } },
      create: { profileId, name, category, source: "github_import" },
      update: {},
    });

    await tx.project.update({
      where: { id: projectId },
      data: { skills: { connect: { id: skill.id } } },
    });
  }
}
