import type {
  GitHubLanguageMix,
  GitHubNormalizedSnapshot,
  GitHubPushVelocity,
  GitHubRepo,
  GitHubRepoEnriched,
  GitHubSyncDelta,
  GitHubWorkPatterns,
} from "@kursa/types";

const ACTIVE_DAYS = 30;
const DORMANT_DAYS = 180;
const MS_PER_DAY = 86400000;

const FRAMEWORK_KEYWORDS = [
  "react", "next", "nextjs", "vue", "angular", "svelte", "django", "flask", "fastapi",
  "express", "nestjs", "spring", "rails", "laravel", "tensorflow", "pytorch", "prisma",
  "tailwind", "graphql", "docker", "kubernetes", "terraform",
];

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / MS_PER_DAY;
}

function extractFrameworkSignals(repos: GitHubRepoEnriched[], profileReadme: string | null): string[] {
  const text = [
    profileReadme ?? "",
    ...repos.map((r) => `${r.readmeExcerpt ?? ""} ${r.description ?? ""} ${r.topics.join(" ")}`),
  ].join(" ").toLowerCase();

  return FRAMEWORK_KEYWORDS.filter((kw) => text.includes(kw));
}

export function computeWorkPatterns(
  repos: GitHubRepoEnriched[],
  profileReadme: string | null,
  weeklyCommitRhythm?: number[],
  previousVelocity?: GitHubPushVelocity | null,
): GitHubWorkPatterns {
  const activeRepos = repos
    .filter((r) => daysSince(r.pushed_at) <= ACTIVE_DAYS)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      pushedAt: r.pushed_at,
      language: r.language,
      topics: r.topics,
    }))
    .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime());

  const dormantRepos = repos
    .filter((r) => daysSince(r.pushed_at) >= DORMANT_DAYS)
    .map((r) => r.name);

  const languageWeights = new Map<string, number>();
  for (const repo of repos) {
    const days = daysSince(repo.pushed_at);
    const weight = days <= ACTIVE_DAYS ? 3 : days <= 90 ? 1.5 : 0.5;
    if (repo.language) {
      languageWeights.set(repo.language, (languageWeights.get(repo.language) ?? 0) + weight);
    }
    for (const { language, weight: lw } of repo.languages ?? []) {
      languageWeights.set(language, (languageWeights.get(language) ?? 0) + lw * 0.5);
    }
  }

  const languageMix: GitHubLanguageMix[] = [...languageWeights.entries()]
    .map(([language, weight]) => ({ language, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  const topicCounts = new Map<string, number>();
  for (const repo of activeRepos) {
    for (const topic of repo.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t);

  const lastActiveAt = repos.length
    ? repos.reduce((max, r) => (r.pushed_at > max ? r.pushed_at : max), repos[0]!.pushed_at)
    : null;

  let pushVelocity: GitHubPushVelocity = "inactive";
  if (activeRepos.length >= 3) pushVelocity = "accelerating";
  else if (activeRepos.length >= 1) pushVelocity = "steady";
  else if (repos.some((r) => daysSince(r.pushed_at) <= 90)) pushVelocity = "slowing";

  if (previousVelocity === "accelerating" && pushVelocity === "steady") pushVelocity = "slowing";
  if (previousVelocity === "steady" && pushVelocity === "accelerating") pushVelocity = "accelerating";

  return {
    activeRepos,
    dormantRepos,
    languageMix,
    topTopics,
    frameworkSignals: extractFrameworkSignals(repos, profileReadme),
    pushVelocity,
    lastActiveAt,
    weeklyCommitRhythm,
  };
}

export function computeSyncDelta(
  previous: GitHubNormalizedSnapshot | null,
  current: GitHubNormalizedSnapshot,
  previousVelocity: GitHubPushVelocity | null,
): GitHubSyncDelta {
  if (!previous) {
    return {
      newRepos: current.repos.map((r) => r.name),
      newlyActiveRepos: current.workPatterns.activeRepos.map((r) => r.name),
      languageShifts: [],
      newTopics: current.workPatterns.topTopics,
      significantPushes: [],
      pushVelocityChanged: false,
    };
  }

  const prevRepoMap = new Map(previous.repos.map((r) => [r.name, r]));
  const newRepos = current.repos.filter((r) => !prevRepoMap.has(r.name)).map((r) => r.name);

  const prevActive = new Set(previous.workPatterns.activeRepos.map((r) => r.name));
  const newlyActiveRepos = current.workPatterns.activeRepos
    .filter((r) => !prevActive.has(r.name))
    .map((r) => r.name);

  const prevTopics = new Set(previous.workPatterns.topTopics);
  const newTopics = current.workPatterns.topTopics.filter((t) => !prevTopics.has(t));

  const significantPushes: GitHubSyncDelta["significantPushes"] = [];
  for (const repo of current.repos) {
    const prev = prevRepoMap.get(repo.name);
    if (prev && prev.pushed_at !== repo.pushed_at) {
      significantPushes.push({
        repo: repo.name,
        previousPushedAt: prev.pushed_at,
        currentPushedAt: repo.pushed_at,
      });
    }
  }

  const prevLang = new Map(previous.workPatterns.languageMix.map((l) => [l.language, l.weight]));
  const languageShifts: GitHubSyncDelta["languageShifts"] = [];
  for (const { language, weight } of current.workPatterns.languageMix) {
    const prevWeight = prevLang.get(language) ?? 0;
    if (weight > prevWeight * 1.2) languageShifts.push({ language, direction: "up" });
    else if (prevWeight > 0 && weight < prevWeight * 0.8) languageShifts.push({ language, direction: "down" });
  }

  return {
    newRepos,
    newlyActiveRepos,
    languageShifts,
    newTopics,
    significantPushes,
    pushVelocityChanged: previousVelocity !== current.workPatterns.pushVelocity,
  };
}

export function deltaHasMaterialChange(delta: GitHubSyncDelta): boolean {
  return (
    delta.newRepos.length > 0 ||
    delta.newlyActiveRepos.length > 0 ||
    delta.languageShifts.length > 0 ||
    delta.newTopics.length > 0 ||
    delta.significantPushes.length > 0 ||
    Boolean(delta.pushVelocityChanged)
  );
}

export function repoToEnriched(repo: GitHubRepo, extras?: Partial<GitHubRepoEnriched>): GitHubRepoEnriched {
  return { ...repo, readmeExcerpt: null, languages: [], ...extras };
}
