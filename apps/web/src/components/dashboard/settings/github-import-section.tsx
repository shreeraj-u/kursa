"use client";

import { useState, useCallback } from "react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Star, RefreshCw, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@kursa/ui/components/button";
import { Skeleton } from "@kursa/ui/components/skeleton";
import type { GitHubRepoPreview, GitHubSyncConfirmRequest, GitHubSyncSummaryResponse } from "@kursa/types";

// Language → colour dot mapping (best-effort subset)
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

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "disconnected" }
  | { name: "review"; repos: GitHubRepoPreview[] }
  | { name: "syncing" }
  | ({ name: "done" } & GitHubSyncSummaryResponse);

export default function GitHubImportSection() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mergeSelected, setMergeSelected] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const PAGE_SIZE = 5;

  const fetchRepos = useCallback(async () => {
    setPhase({ name: "loading" });
    try {
      const data = await api.github.repos();
      if (!data.connected) {
        setPhase({ name: "disconnected" });
        return;
      }
      const reviewable = data.repos.filter((r) => r.status !== "existing");
      setPhase({ name: "review", repos: reviewable });
      setSelected(new Set(reviewable.filter((r) => r.status === "new").map((r) => r.repo.id)));
      setMergeSelected(
        new Set(reviewable.filter((r) => r.status === "merge_candidate").map((r) => r.repo.id))
      );
      setShowAll(false);
    } catch {
      setPhase({ name: "idle" });
      toast.error("Could not fetch GitHub repos");
    }
  }, []);

  async function handleConnect() {
    setPhase({ name: "loading" });
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: window.location.href,
      });
    } catch {
      setPhase({ name: "idle" });
      toast.error("GitHub connection failed");
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
          (result.merged > 0 ? `, updated ${result.merged}` : "")
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
      setPhase({ name: "idle" });
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
          r.status === "new" ? selected.has(r.repo.id) : mergeSelected.has(r.repo.id)
        ).length
      : 0;

  return (
    <div className="mt-8">
      {/* Header row */}
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

        {phase.name === "review" && (
          <button
            onClick={fetchRepos}
            className="text-mute hover:text-ink-2 transition-colors p-1.5 rounded-lg hover:bg-bg-sub"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">

        {/* ── Idle ── */}
        {phase.name === "idle" && (
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-bg-sub-2 border border-line flex items-center justify-center shrink-0">
                <GitHubLogoIcon className="w-4 h-4 text-ink-2" />
              </div>
              <div>
                <p className="font-medium text-ink-2" style={{ fontSize: "var(--text-sm)" }}>
                  Import your repositories
                </p>
                <p className="text-mute-2 mt-0.5" style={{ fontSize: "var(--text-xs)" }}>
                  Pull owned repos in as profile projects, with skills auto-tagged
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={fetchRepos} className="shrink-0 ml-4">
              Connect <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Loading ── */}
        {phase.name === "loading" && (
          <div className="px-6 py-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-bg-sub-2" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32 rounded bg-bg-sub-2" />
                  <Skeleton className="h-2.5 w-48 rounded bg-bg-sub-2" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full bg-bg-sub-2" />
              </div>
            ))}
          </div>
        )}

        {/* ── Disconnected ── */}
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
                Authorize GitHub so Kursa can read your repositories and import them as profile projects.
              </p>
            </div>
            <Button size="sm" onClick={handleConnect}>
              <GitHubLogoIcon className="w-3.5 h-3.5 mr-1.5" />
              Authorize GitHub
            </Button>
          </div>
        )}

        {/* ── Review ── */}
        {phase.name === "review" && (
          <>
            {phase.repos.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-mute-2" style={{ fontSize: "var(--text-sm)" }}>
                  All your repos are already in your profile.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-line">
                  {(showAll ? phase.repos : phase.repos.slice(0, PAGE_SIZE)).map(({ repo, status, existingProjectId }) => {
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
                        {/* Checkbox indicator */}
                        <div
                          className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors ${
                            checked
                              ? "bg-ink border-ink"
                              : "border-line bg-transparent"
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 text-bg" strokeWidth={3} />}
                        </div>

                        {/* Repo info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-medium text-ink-2"
                              style={{ fontSize: "var(--text-sm)" }}
                            >
                              {repo.name}
                            </span>

                            {status === "merge_candidate" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Updates existing
                              </span>
                            )}

                            {repo.language && (
                              <span
                                className="inline-flex items-center gap-1 text-mute-2"
                                style={{ fontSize: "var(--text-xs)" }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: langColor ?? "#8b8b8b" }}
                                />
                                {repo.language}
                              </span>
                            )}
                          </div>

                          {repo.description && (
                            <p
                              className="text-mute-2 mt-0.5 line-clamp-1"
                              style={{ fontSize: "var(--text-xs)" }}
                            >
                              {repo.description}
                            </p>
                          )}

                          {repo.topics.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {repo.topics.slice(0, 4).map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded-full border border-line text-mute-2 bg-bg-sub-2"
                                  style={{ fontSize: "10px" }}
                                >
                                  {t}
                                </span>
                              ))}
                              {repo.topics.length > 4 && (
                                <span className="text-mute-3" style={{ fontSize: "10px" }}>
                                  +{repo.topics.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stars */}
                        {repo.stargazers_count > 0 && (
                          <div
                            className="flex items-center gap-1 text-mute-3 shrink-0 mt-0.5"
                            style={{ fontSize: "var(--text-xs)" }}
                          >
                            <Star className="w-3 h-3" />
                            <span>{repo.stargazers_count}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Show more */}
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

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-bg-sub/30">
                  <p className="text-mute-2" style={{ fontSize: "var(--text-xs)" }}>
                    {selectedCount === 0
                      ? "Nothing selected"
                      : `${selectedCount} repo${selectedCount !== 1 ? "s" : ""} selected`}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSync}
                    disabled={selectedCount === 0}
                  >
                    Import selected
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Syncing ── */}
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

        {/* ── Done ── */}
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
                  {phase.skills.length > 0 && (
                    <p>Added skills: {phase.skills.slice(0, 8).join(", ")}{phase.skills.length > 8 ? ` +${phase.skills.length - 8}` : ""}</p>
                  )}
                  {phase.githubUrl && <p>GitHub profile: {phase.githubUrl}</p>}
                  <p>Saved as career activity</p>
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchRepos} className="shrink-0 text-mute-2">
              Sync again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
