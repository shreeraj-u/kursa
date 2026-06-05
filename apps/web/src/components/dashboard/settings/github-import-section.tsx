"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Star, RefreshCw, ArrowRight, Check, Zap } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@kursa/ui/components/button";
import { Skeleton } from "@kursa/ui/components/skeleton";
import type {
  GitHubRepoPreview,
  GitHubStatusResponse,
  GitHubSyncConfirmRequest,
  GitHubSyncSummaryResponse,
  ProjectProposalSummary,
} from "@kursa/types";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  PHP: "#4F5D95",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Scala: "#c22d40",
};

const VELOCITY_LABEL: Record<string, string> = {
  accelerating: "Accelerating",
  steady: "Steady",
  slowing: "Slowing",
  inactive: "Inactive",
};

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "disconnected" }
  | { name: "connected"; status: GitHubStatusResponse; proposals: ProjectProposalSummary[] }
  | { name: "review"; repos: GitHubRepoPreview[]; status: GitHubStatusResponse }
  | { name: "syncing" }
  | ({ name: "done" } & GitHubSyncSummaryResponse);

function formatLastSync(iso: string | null): string {
  if (!iso) return "Never synced";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Synced recently";
  if (hours < 24) return `Synced ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Synced ${days}d ago`;
}

export default function GitHubImportSection() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mergeSelected, setMergeSelected] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [syncingProfile, setSyncingProfile] = useState(false);
  const PAGE_SIZE = 5;

  const loadConnected = useCallback(async () => {
    setPhase({ name: "loading" });
    try {
      const status = await api.github.status();
      if (!status.connected) {
        setPhase({ name: "disconnected" });
        return;
      }
      const { data: proposals } = await api.projectProposals.list("pending");
      setPhase({ name: "connected", status, proposals });
    } catch (err: unknown) {
      setPhase({ name: "idle" });
      toast.error(err instanceof Error ? err.message : "Could not load GitHub status");
    }
  }, []);

  const fetchRepos = useCallback(async () => {
    setPhase({ name: "loading" });
    try {
      const [status, data] = await Promise.all([api.github.status(), api.github.repos()]);
      if (!status.connected || !data?.connected) {
        setPhase({ name: "disconnected" });
        return;
      }
      const reviewable = data.repos.filter((r) => r.status !== "existing");
      if (reviewable.length === 0) {
        const { data: proposals } = await api.projectProposals.list("pending");
        setPhase({ name: "connected", status, proposals });
        return;
      }
      setPhase({ name: "review", repos: reviewable, status });
      setSelected(new Set(reviewable.filter((r) => r.status === "new").map((r) => r.repo.id)));
      setMergeSelected(
        new Set(reviewable.filter((r) => r.status === "merge_candidate").map((r) => r.repo.id)),
      );
      setShowAll(false);
    } catch (err: unknown) {
      setPhase({ name: "idle" });
      toast.error(err instanceof Error ? err.message : "Could not fetch GitHub repos");
    }
  }, []);

  useEffect(() => {
    void loadConnected();
  }, [loadConnected]);

  async function handleConnect() {
    setPhase({ name: "loading" });
    try {
      const result = await authClient.linkSocial({
        provider: "github",
        callbackURL: window.location.href,
        scopes: ["repo"],
      });
      const authUrl = result.data?.url;
      if (authUrl) {
        window.location.assign(authUrl);
        return;
      }
      await loadConnected();
    } catch (err: unknown) {
      setPhase({ name: "disconnected" });
      toast.error(err instanceof Error ? err.message : "GitHub connection failed");
    }
  }

  async function handleProfileSync() {
    setSyncingProfile(true);
    try {
      await api.github.ingest();
      toast.success("GitHub profile sync scheduled");
      setTimeout(() => void loadConnected(), 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingProfile(false);
    }
  }

  async function acceptProposal(id: string) {
    try {
      const { project } = await api.projectProposals.accept(id);
      toast.success(`Added ${project.title} to your profile`);
      await loadConnected();
    } catch {
      toast.error("Could not accept project proposal");
    }
  }

  async function dismissProposal(id: string) {
    try {
      await api.projectProposals.dismiss(id);
      if (phase.name === "connected") {
        setPhase({
          ...phase,
          proposals: phase.proposals.filter((p) => p.id !== id),
        });
      }
    } catch {
      toast.error("Could not dismiss proposal");
    }
  }

  async function handleSync() {
    if (phase.name !== "review") return;

    const body: GitHubSyncConfirmRequest = {
      selectedRepoIds: phase.repos
        .filter((r) => r.status === "new" && selected.has(r.repo.id))
        .map((r) => r.repo.id),
      mergeRepoIds: phase.repos
        .filter((r) => r.status === "merge_candidate" && mergeSelected.has(r.repo.id))
        .map((r) => ({ repoId: r.repo.id, projectId: r.existingProjectId! })),
    };

    setPhase({ name: "syncing" });
    try {
      const result = await api.github.sync(body);
      setPhase({ name: "done", ...result });
      toast.success(
        `Profile updated — imported ${result.imported} project${result.imported !== 1 ? "s" : ""}` +
          (result.merged > 0 ? `, updated ${result.merged}` : ""),
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
      await loadConnected();
    }
  }

  function toggle(id: number, isNew: boolean) {
    const setter = isNew ? setSelected : setMergeSelected;
    setter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedCount =
    phase.name === "review"
      ? [...phase.repos].filter((r) =>
          r.status === "new" ? selected.has(r.repo.id) : mergeSelected.has(r.repo.id),
        ).length
      : 0;

  const statusBar =
    phase.name === "connected" || phase.name === "review" ? phase.status : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div
            className="mono mb-0.5 text-mute tracking-[0.06em] uppercase"
            style={{ fontSize: "var(--text-xs)" }}
          >
            integrations
          </div>
          <h3 className="font-semibold text-ink" style={{ fontSize: "var(--text-lg)" }}>
            GitHub
          </h3>
        </div>
        {(phase.name === "connected" || phase.name === "review") && (
          <button
            onClick={() => void (phase.name === "review" ? fetchRepos() : loadConnected())}
            className="text-mute hover:text-ink-2 transition-colors p-1.5 rounded-lg hover:bg-bg-sub"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        {phase.name === "idle" && (
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-bg-sub-2 border border-line flex items-center justify-center shrink-0">
                <GitHubLogoIcon className="w-4 h-4 text-ink-2" />
              </div>
              <div>
                <p className="font-medium text-ink-2" style={{ fontSize: "var(--text-sm)" }}>
                  Deep profile from GitHub
                </p>
                <p className="text-mute-2 mt-0.5" style={{ fontSize: "var(--text-xs)" }}>
                  Daily sync learns your stack, work patterns, and suggests projects
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadConnected()} className="shrink-0 ml-4">
              Connect <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        {phase.name === "loading" && (
          <div className="px-6 py-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-bg-sub-2" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32 rounded bg-bg-sub-2" />
                  <Skeleton className="h-2.5 w-48 rounded bg-bg-sub-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {phase.name === "disconnected" && (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-bg-sub-2 border border-line flex items-center justify-center">
              <GitHubLogoIcon className="w-5 h-5 text-ink-2" />
            </div>
            <div>
              <p className="font-medium text-ink-2" style={{ fontSize: "var(--text-sm)" }}>
                Connect your GitHub account
              </p>
              <p className="text-mute-2 mt-1 max-w-xs" style={{ fontSize: "var(--text-xs)" }}>
                OAuth lets Kursa read repos, READMEs, and activity — skills and projects land as proposals until you accept.
              </p>
            </div>
            <Button size="sm" onClick={() => void handleConnect()}>
              <GitHubLogoIcon className="w-3.5 h-3.5 mr-1.5" />
              Authorize GitHub
            </Button>
          </div>
        )}

        {statusBar && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-line bg-bg-sub/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-bg-sub-2 border border-line flex items-center justify-center shrink-0">
                <GitHubLogoIcon className="w-4 h-4 text-ink-2" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-ink-2 truncate" style={{ fontSize: "var(--text-sm)" }}>
                  {statusBar.username ? `@${statusBar.username}` : "Connected"}
                </p>
                <p className="text-mute-2" style={{ fontSize: "var(--text-xs)" }}>
                  {formatLastSync(statusBar.lastIngestedAt)}
                  {statusBar.snapshotStatus === "pending" && " · syncing…"}
                  {statusBar.lastError && ` · ${statusBar.lastError}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {statusBar.pushVelocity && (
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-sub-2 px-2 py-0.5 text-mute-2" style={{ fontSize: "10px" }}>
                  <Zap className="w-3 h-3" />
                  {VELOCITY_LABEL[statusBar.pushVelocity] ?? statusBar.pushVelocity}
                </span>
              )}
              <Button size="sm" variant="outline" onClick={() => void handleProfileSync()} disabled={syncingProfile}>
                {syncingProfile ? "Scheduling…" : "Sync now"}
              </Button>
            </div>
          </div>
        )}

        {phase.name === "connected" && (
          <div className="px-6 py-5 space-y-5">
            {(phase.status.pendingSkillProposals > 0 || phase.status.pendingProjectProposals > 0) && (
              <div className="rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4">
                <p className="text-xs font-medium text-ink">Pending proposals</p>
                <p className="mt-1 text-2xs text-mute-2 leading-relaxed">
                  {phase.status.pendingSkillProposals > 0 && (
                    <>
                      {phase.status.pendingSkillProposals} skill proposal
                      {phase.status.pendingSkillProposals !== 1 ? "s" : ""}
                    </>
                  )}
                  {phase.status.pendingSkillProposals > 0 && phase.status.pendingProjectProposals > 0 && " · "}
                  {phase.status.pendingProjectProposals > 0 && (
                    <>
                      {phase.status.pendingProjectProposals} project proposal
                      {phase.status.pendingProjectProposals !== 1 ? "s" : ""}
                    </>
                  )}
                </p>
                {phase.status.pendingSkillProposals > 0 && (
                  <Link
                    href={"/dashboard/skills" as Route}
                    className="mt-2 inline-block text-2xs text-accent hover:underline"
                  >
                    Review skills →
                  </Link>
                )}
              </div>
            )}

            {phase.proposals.length > 0 ? (
              <div>
                <div className="mono text-2xs uppercase tracking-mono text-mute-2 mb-3">
                  project proposals · {phase.proposals.length}
                </div>
                <div className="divide-y divide-line rounded-lg border border-line overflow-hidden">
                  {phase.proposals.map((p) => (
                    <div key={p.id} className="px-4 py-3 bg-bg-sub/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-2">{p.title}</p>
                          {p.description && (
                            <p className="text-mute-2 mt-0.5 line-clamp-2" style={{ fontSize: "var(--text-xs)" }}>
                              {p.description}
                            </p>
                          )}
                          <p className="text-mute-3 mt-1" style={{ fontSize: "10px" }}>
                            {p.evidence}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => void acceptProposal(p.id)}>
                            Accept
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void dismissProposal(p.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-mute-2 text-center py-4" style={{ fontSize: "var(--text-sm)" }}>
                No pending project proposals. Kursa will suggest repos after the next daily sync.
              </p>
            )}

            <div className="flex justify-center pt-2">
              <Button size="sm" variant="outline" onClick={() => void fetchRepos()}>
                Review repos to import
              </Button>
            </div>
          </div>
        )}

        {phase.name === "review" && (
          <>
            {phase.repos.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-mute-2" style={{ fontSize: "var(--text-sm)" }}>
                  All your repos are already in your profile or pending as proposals.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-line">
                  {(showAll ? phase.repos : phase.repos.slice(0, PAGE_SIZE)).map(({ repo, status }) => {
                    const isNew = status === "new";
                    const checked = isNew ? selected.has(repo.id) : mergeSelected.has(repo.id);
                    const langColor = repo.language ? LANG_COLORS[repo.language] : undefined;

                    return (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => toggle(repo.id, isNew)}
                        className={`w-full text-left flex items-start gap-4 px-6 py-4 transition-colors ${
                          checked ? "bg-bg-sub" : "hover:bg-bg-sub/50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${
                            checked ? "bg-ink border-ink" : "border-line bg-transparent"
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 text-bg" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-ink-2" style={{ fontSize: "var(--text-sm)" }}>
                              {repo.name}
                            </span>
                            {status === "merge_candidate" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Updates existing
                              </span>
                            )}
                            {repo.language && (
                              <span className="inline-flex items-center gap-1 text-mute-2" style={{ fontSize: "var(--text-xs)" }}>
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: langColor ?? "#8b8b8b" }}
                                />
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-mute-2 mt-0.5 line-clamp-1" style={{ fontSize: "var(--text-xs)" }}>
                              {repo.description}
                            </p>
                          )}
                        </div>
                        {repo.stargazers_count > 0 && (
                          <div className="flex items-center gap-1 text-mute-3 shrink-0 mt-0.5" style={{ fontSize: "var(--text-xs)" }}>
                            <Star className="w-3 h-3" />
                            <span>{repo.stargazers_count}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!showAll && phase.repos.length > PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="w-full py-3 text-mute-2 hover:text-ink-2 hover:bg-bg-sub/50 transition-colors border-t border-line"
                    style={{ fontSize: "var(--text-xs)" }}
                  >
                    Show {phase.repos.length - PAGE_SIZE} more
                  </button>
                )}
                <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-bg-sub/30">
                  <p className="text-mute-2" style={{ fontSize: "var(--text-xs)" }}>
                    {selectedCount === 0 ? "Nothing selected" : `${selectedCount} repo${selectedCount !== 1 ? "s" : ""} selected`}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => void loadConnected()}>
                      Back
                    </Button>
                    <Button size="sm" onClick={() => void handleSync()} disabled={selectedCount === 0}>
                      Import selected
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {phase.name === "syncing" && (
          <div className="px-6 py-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-bg-sub-2" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28 rounded bg-bg-sub-2" />
                  <Skeleton className="h-2.5 w-40 rounded bg-bg-sub-2" />
                </div>
              </div>
            ))}
            <p className="text-mute-2 text-xs pt-1">Importing projects…</p>
          </div>
        )}

        {phase.name === "done" && (
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-medium text-ink-2" style={{ fontSize: "var(--text-sm)" }}>
                  Profile updated
                </p>
                <div className="mt-2 grid gap-1 text-mute-2" style={{ fontSize: "var(--text-xs)" }}>
                  <p>Imported {phase.imported} project{phase.imported !== 1 ? "s" : ""}</p>
                  <p>Updated {phase.merged} project{phase.merged !== 1 ? "s" : ""}</p>
                  {phase.githubUrl && <p>GitHub profile: {phase.githubUrl}</p>}
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void loadConnected()} className="shrink-0 text-mute-2">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
