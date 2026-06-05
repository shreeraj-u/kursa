import prisma from "@kursa/db";
import type {
  GitHubRepo,
  GitHubRepoPreview,
  GitHubSyncPreviewResponse,
  GitHubSyncConfirmRequest,
  GitHubSyncSummaryResponse,
} from "@kursa/types";

export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

async function fetchGitHubUser(token: string): Promise<{ login: string; html_url?: string } | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ login: string; html_url?: string }>;
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
): Promise<GitHubSyncSummaryResponse> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found");

  const ghUser = await fetchGitHubUser(token);
  const githubUrl = ghUser?.html_url ?? (ghUser?.login ? `https://github.com/${ghUser.login}` : undefined);
  const repoById = new Map(allRepos.map((r) => [r.id, r]));
  const syncedProjects: string[] = [];
  const syncedSkills = new Set<string>();

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

      collectRepoSkills(repo).forEach((skill) => syncedSkills.add(skill.name));
      syncedProjects.push(repo.name);
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

      collectRepoSkills(repo).forEach((skill) => syncedSkills.add(skill.name));
      syncedProjects.push(repo.name);
      await upsertSkillsForRepo(tx, profile.id, projectId, repo);
    }

    if (githubUrl) {
      await tx.socialLink.upsert({
        where: { profileId_platform: { profileId: profile.id, platform: "github" } },
        create: { profileId: profile.id, platform: "github", url: githubUrl },
        update: { url: githubUrl },
      });
    }
  });

  const summary: GitHubSyncSummaryResponse = {
    imported: request.selectedRepoIds.length,
    merged: request.mergeRepoIds.length,
    skills: [...syncedSkills].sort((a, b) => a.localeCompare(b)),
    projects: syncedProjects,
    ...(githubUrl ? { githubUrl } : {}),
  };

  const projectText = summary.projects.length > 0 ? ` Projects: ${summary.projects.join(", ")}.` : "";
  const skillText = summary.skills.length > 0 ? ` Skills tagged: ${summary.skills.join(", ")}.` : "";

  const { ingestEvent } = await import("./events.service.js");
  await ingestEvent(userId, {
    type: "github_sync",
    source: "system",
    body: `GitHub profile updated: imported ${summary.imported} project${summary.imported === 1 ? "" : "s"}, updated ${summary.merged} project${summary.merged === 1 ? "" : "s"}.${projectText}${skillText}`,
    structured: {
      type: "github_sync",
      imported: summary.imported,
      merged: summary.merged,
      skills: summary.skills,
      projects: summary.projects,
      githubUrl: summary.githubUrl,
      syncedAt: new Date().toISOString(),
    },
    skipDelta: true,
    skipDistill: true,
    skipEnrich: true,
  });

  return summary;
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function collectRepoSkills(repo: GitHubRepo): { name: string; category: "technical" | "tool" }[] {
  const seen = new Set<string>();
  const skillDefs: { name: string; category: "technical" | "tool" }[] = [];
  const add = (name: string | null | undefined, category: "technical" | "tool") => {
    const trimmed = name?.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    skillDefs.push({ name: trimmed, category });
  };

  add(repo.language, "technical");
  repo.topics.forEach((topic) => add(topic, "tool"));
  return skillDefs;
}

async function upsertSkillsForRepo(
  tx: TxClient,
  profileId: string,
  projectId: string,
  repo: GitHubRepo
): Promise<void> {
  for (const { name, category } of collectRepoSkills(repo)) {
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
