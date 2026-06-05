"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type {
  SkillRecommendation,
  SkillSummary,
  SkillsOverviewResponse,
  SkillUpdateInput,
} from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import { api } from "@/lib/api";

import { AddSkillDialog } from "./add-skill-dialog";
import { SkillRow } from "./skill-row";

const CATEGORY_LABELS: Record<string, string> = {
  technical: "Technical",
  soft: "Leadership & soft",
  tool: "Tools",
};

type Props = {
  initialOverview: SkillsOverviewResponse;
};

export default function SkillsPageClient({ initialOverview }: Props) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [overview, setOverview] = useState(initialOverview);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.skills.overview();
      setOverview(data);
    } catch {
      toast.error("Could not refresh skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`proposal-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, overview.proposals]);

  const grouped = overview.skills.reduce<Record<string, SkillSummary[]>>((acc, s) => {
    const key = s.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  async function acceptProposal(id: string) {
    try {
      await api.skills.acceptProposal(id);
      toast.success("Skill added to your profile");
      await refresh();
    } catch {
      toast.error("Could not accept proposal");
    }
  }

  async function dismissProposal(id: string) {
    try {
      await api.skills.dismissProposal(id);
      await refresh();
    } catch {
      toast.error("Could not dismiss");
    }
  }

  async function handleDelete(skillId: string) {
    if (!confirm("Remove this skill from your profile?")) return;
    try {
      await api.skills.delete(skillId);
      toast.success("Skill removed");
      await refresh();
    } catch {
      toast.error("Could not delete skill");
    }
  }

  async function handleUpdate(skillId: string, patch: SkillUpdateInput) {
    try {
      await api.skills.update(skillId, patch);
      setEditingId(null);
      await refresh();
    } catch {
      toast.error("Could not save skill");
    }
  }

  async function addFromRecommendation(rec: SkillRecommendation) {
    try {
      await api.skills.create({
        name: rec.skillName,
        category: "technical",
        confidenceRating: 3,
        source: rec.source === "market" ? "market" : rec.source === "path" ? "path" : "self_reported",
      });
      toast.success(`Added ${rec.skillName}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add skill");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Skills" />

      <div className="flex flex-col gap-5 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-ink">Skills</h1>
            <p className="mt-1.5 text-sm text-mute leading-relaxed">
              What Kursa knows about your strengths — updated from resume, journal, market, and Aria chat.
            </p>
            <p className="mono mt-2 text-2xs text-mute-2">
              profile {overview.signals.profileCompleteness}% · {overview.skills.length} skills ·{" "}
              {overview.signals.staleCount} stale · {overview.signals.pendingProposalCount} pending
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mono inline-flex items-center gap-1.5 rounded px-3 py-1.5 self-start"
            style={{
              fontSize: 10,
              background: "var(--ink)",
              color: "var(--bg)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={12} />
            add skill
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4 min-w-0">
            {Object.keys(CATEGORY_LABELS).map((cat) => {
              const items = grouped[cat] ?? [];
              if (items.length === 0) return null;
              return (
                <section
                  key={cat}
                  className="rounded-lg p-4"
                  style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
                >
                  <div className="mono mb-3 flex justify-between text-2xs text-mute-2">
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((skill) => (
                      <SkillRow
                        key={skill.id}
                        skill={skill}
                        editing={editingId === skill.id}
                        onEdit={() => setEditingId(skill.id)}
                        onCancel={() => setEditingId(null)}
                        onSave={(patch) => void handleUpdate(skill.id, patch)}
                        onDelete={() => void handleDelete(skill.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {overview.skills.length === 0 && (
              <div
                className="rounded-lg p-8"
                style={{ border: "1px dashed var(--line)", background: "var(--bg-sub)" }}
              >
                <p className="text-sm text-mute text-center">
                  No skills yet — add manually, accept a proposal from Aria, or pick from your profile below.
                </p>
                {overview.recommendations.length > 0 && (
                  <div className="mt-5">
                    <div className="mono mb-3 text-center text-2xs text-mute-2">
                      suggested from your profile & path
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {overview.recommendations.slice(0, 8).map((rec) => (
                        <button
                          key={`${rec.skillName}-${rec.source}`}
                          type="button"
                          onClick={() => void addFromRecommendation(rec)}
                          className="mono inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs border transition-colors hover:bg-accent-soft"
                          style={{
                            borderColor: "var(--accent-line)",
                            background: "var(--surface)",
                            color: "var(--ink)",
                            cursor: "pointer",
                          }}
                          title={rec.reason}
                        >
                          + {rec.skillName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {overview.learningGoals.length > 0 && (
              <section
                className="rounded-lg p-4"
                style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
              >
                <div className="mono mb-2 text-2xs text-mute-2">learning goals</div>
                <div className="flex flex-wrap gap-2">
                  {overview.learningGoals.map((g) => (
                    <span key={g.id} className="chip text-2xs" title={g.skillName}>
                      {g.displayName ?? g.skillName} · {g.status.toLowerCase()}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            {overview.proposals.length > 0 && (
              <section
                className="rounded-lg p-4"
                style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
              >
                <div className="mono mb-3 text-2xs text-mute-2">pending from aria</div>
                <div className="flex flex-col gap-3">
                  {overview.proposals.map((p) => (
                    <div
                      key={p.id}
                      id={`proposal-${p.id}`}
                      className="rounded-md p-3"
                      style={{
                        border: highlightId === p.id ? "1px solid var(--accent)" : "1px solid var(--line)",
                        background: highlightId === p.id ? "var(--accent-soft)" : "var(--bg-sub)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-ink">{p.displayName}</p>
                        {p.source === "github" && (
                          <span className="mono rounded border border-line px-1 py-px text-[8px] text-mute-2">github</span>
                        )}
                      </div>
                      <p className="mt-1 text-2xs text-mute leading-relaxed">{p.evidence}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void acceptProposal(p.id)}
                          className="mono rounded px-2 py-1"
                          style={{
                            fontSize: 9,
                            background: "var(--accent)",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          + add
                        </button>
                        <button
                          type="button"
                          onClick={() => void dismissProposal(p.id)}
                          className="mono rounded px-2 py-1"
                          style={{
                            fontSize: 9,
                            border: "1px solid var(--line)",
                            background: "transparent",
                            color: "var(--mute)",
                            cursor: "pointer",
                          }}
                        >
                          dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section
              className="rounded-lg p-4"
              style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              <div className="mono mb-3 text-2xs text-mute-2">recommended to learn</div>
              {overview.recommendations.length === 0 ? (
                <p className="text-2xs text-mute">Set a target role and chat with Aria for tailored suggestions.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {overview.recommendations.map((rec) => (
                    <div
                      key={`${rec.skillName}-${rec.source}`}
                      className="rounded-md p-3"
                      style={{ border: "1px solid var(--line)", background: "var(--bg-sub)" }}
                    >
                      <p className="text-xs font-medium text-ink">{rec.skillName}</p>
                      <p className="mt-0.5 text-2xs text-mute leading-relaxed">{rec.reason}</p>
                      <button
                        type="button"
                        onClick={() => void addFromRecommendation(rec)}
                        className="mono mt-2 rounded px-2 py-1"
                        style={{
                          fontSize: 9,
                          background: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        + add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <AddSkillDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          void refresh();
        }}
      />

      {loading && (
        <div className="mono fixed bottom-4 right-4 text-2xs text-mute-2">refreshing…</div>
      )}
    </div>
  );
}
