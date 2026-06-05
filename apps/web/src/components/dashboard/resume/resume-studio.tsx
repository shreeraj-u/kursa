"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Pencil, Sparkles } from "lucide-react";
import type { AtsIssue, Resume, ResumeContent, ResumeQuota } from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import ResumeDocument from "./resume-document";
import ResumeEditor from "./resume-editor";
import { downloadResumePdf } from "./resume-pdf";

interface ResumeStudioProps {
  initialResumes: Resume[];
  quota: ResumeQuota;
  activeJourneyTitle?: string | null;
}

const SEVERITY_BG: Record<AtsIssue["severity"], string> = {
  high: "bg-warn",
  medium: "bg-mute",
  low: "bg-mute-3",
};

const RESUME_FLOW = [
  "generate from profile",
  "edit with control",
  "score ATS",
  "download PDF",
];

export default function ResumeStudio({
  initialResumes,
  quota: initialQuota,
  activeJourneyTitle = null,
}: ResumeStudioProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [quota, setQuota] = useState(initialQuota);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(resumes[0]?.id ?? null);
  const [draft, setDraft] = useState<ResumeContent | null>(null); // non-null = editing
  const [aiDraftActive, setAiDraftActive] = useState(false);
  const [aiChangedPaths, setAiChangedPaths] = useState<string[]>([]);

  const selected = resumes.find((r) => r.id === selectedId) ?? resumes[0] ?? null;
  const quotaReached = quota.used >= quota.limit;
  const editing = draft !== null;
  const busy = generating || analyzing || improving || saving;

  useEffect(() => {
    if (initialResumes.length > 0) return;
    let cancelled = false;
    void api.resume
      .list()
      .then((data) => {
        if (cancelled) return;
        setResumes(data.resumes);
        setQuota(data.quota);
        if (data.resumes[0]) {
          setSelectedId((id) => id ?? data.resumes[0]!.id);
        }
      })
      .catch(() => {
        /* SSR may miss session cookies when API URL differs from web origin */
      });
    return () => {
      cancelled = true;
    };
  }, [initialResumes.length]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      await api.resume.generate();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate resume");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!selected || !draft) return;
    setSaving(true);
    setError(null);
    try {
      await api.resume.update(selected.id, draft);
      if (aiDraftActive) await api.resume.analyze(selected.id);
      setDraft(null);
      setAiDraftActive(false);
      setAiChangedPaths([]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function analyze() {
    if (!selected) return;
    setAnalyzing(true);
    setError(null);
    try {
      await api.resume.analyze(selected.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze resume");
    } finally {
      setAnalyzing(false);
    }
  }


  async function improveAts() {
    if (!selected) return;
    setImproving(true);
    setError(null);
    try {
      const result = await api.resume.improveAts(selected.id);
      setDraft(result.draft);
      setAiChangedPaths(result.changedPaths);
      setAiDraftActive(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply ATS improvements");
    } finally {
      setImproving(false);
    }
  }

  async function download() {
    if (!selected) return;
    try {
      await downloadResumePdf(selected.content);
    } catch {
      setError("Failed to build PDF");
    }
  }

  const generateLabel = generating
    ? resumes.length === 0
      ? "generating…"
      : "regenerating…"
    : resumes.length === 0
      ? "generate résumé"
      : "regenerate";

  // Empty state.
  if (!selected) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader pageTitle="Resume studio" />
        <div className="px-8 pt-6 pb-8 flex flex-1 flex-col gap-5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tighter text-ink">Resume studio</h1>
            <PageHelpButton help={DASHBOARD_PAGE_HELP.resume} label="Resume studio" />
          </div>
          <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="text-sm text-ink font-medium">No résumé yet</div>
            <div className="text-xs text-mute-2">
              Generate an ATS-scored résumé from your profile, shaped toward your active
              career path. You can edit it, re-analyze it, and download any version as a PDF.
            </div>
            <div className="mono text-2xs text-mute-3">
              {activeJourneyTitle
                ? `Shaped by active journey: ${activeJourneyTitle}`
                : "General résumé — generate a journey for sharper targeting."}
            </div>
            <Button
              onClick={generate}
              disabled={generating || quotaReached}
              variant="outline"
              size="sm"
              className="mono text-ink border-line rounded-sm bg-surface hover:bg-bg-sub-2"
            >
              {generateLabel}
            </Button>
            {quotaReached && (
              <div className="mono text-2xs text-mute-3">
                daily limit reached ({quota.used}/{quota.limit})
              </div>
            )}
            {error && <div className="mono text-2xs text-warn">{error}</div>}
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Resume studio" />
      <div className="px-8 pt-6 pb-8 flex flex-col gap-4 flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tighter text-ink">Resume studio</h1>
              <PageHelpButton help={DASHBOARD_PAGE_HELP.resume} label="Resume studio" />
            </div>
            <div className="mono mt-1 text-xs text-mute">
              {selected.targetRole ? `tailored · ${selected.targetRole}` : "general résumé"}
              {editing && " · editing"}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
              A résumé version is generated from the same profile memory that powers your journey. Improve it, re-score it, and export without losing control of the truth.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="mono text-2xs text-mute-3">
              {quota.used}/{quota.limit} today
            </span>
            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDraft(null); setAiDraftActive(false); setAiChangedPaths([]); }}
                  disabled={saving}
                  className="mono text-mute border-line rounded-sm px-2.5 py-1 bg-bg hover:bg-bg-sub-2 flex items-center gap-1.5"
                >
                  cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={save}
                  disabled={saving}
                  className="mono text-ink border-line rounded-sm px-2.5 py-1 bg-bg hover:bg-bg-sub-2 flex items-center gap-1.5"
                >
                  {saving ? (aiDraftActive ? "saving + analyzing…" : "saving…") : "save"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDraft(structuredClone(selected.content)); setAiDraftActive(false); setAiChangedPaths([]); }}
                  disabled={busy}
                  className="mono text-ink border-line rounded-sm px-2.5 py-1 bg-bg hover:bg-bg-sub-2 flex items-center gap-1.5"
                >
                  <Pencil size={11} /> edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyze}
                  disabled={busy}
                  className="mono text-mute border-line rounded-sm px-2.5 py-1 bg-bg hover:bg-bg-sub-2 flex items-center gap-1.5"
                >
                  {analyzing ? "analyzing…" : "analyze ATS again"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={download}
                  disabled={busy}
                  className="mono text-ink border-line rounded-sm px-2.5 py-1 bg-bg hover:bg-bg-sub-2 flex items-center gap-1.5"
                >
                  <Download size={11} /> download pdf
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generate}
                  disabled={busy || quotaReached}
                  className="mono text-mute border-line rounded-sm px-2.5 py-1 bg-bg hover:bg-bg-sub-2 flex items-center gap-1.5"
                >
                  {generateLabel}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface px-3 py-2 mono text-2xs text-mute">
          {activeJourneyTitle
            ? `Shaped by active journey: ${activeJourneyTitle}`
            : "General résumé — generate a journey for sharper targeting."}
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {RESUME_FLOW.map((step, index) => (
            <div key={step} className="rounded-lg border border-line bg-surface px-3 py-2">
              <div className="mono text-2xs text-mute-3">step {index + 1}</div>
              <div className="mt-0.5 text-xs font-medium text-ink">{step}</div>
            </div>
          ))}
        </div>

        {/* Version bar */}
        <div className="flex items-center gap-3 overflow-x-auto border-b border-line pb-2">
          {resumes.map((r) => {
            const active = r.id === selected.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  if (editing) return;
                  setSelectedId(r.id);
                }}
                disabled={editing}
                className={`mono whitespace-nowrap disabled:cursor-not-allowed text-[10px] pb-[2px] ${
                  active
                    ? "text-ink font-semibold border-b border-ink"
                    : "text-mute-3 font-normal border-none"
                }`}
              >
                v{r.version}
                {r.targetRole ? ` · ${r.targetRole}` : ""}
              </button>
            );
          })}
          <span className="ml-auto mono text-2xs text-mute-3 whitespace-nowrap">
            {resumes.length} {resumes.length === 1 ? "version" : "versions"}
          </span>
        </div>

        {quotaReached && !editing && (
          <div className="mono text-2xs text-mute-3">
            daily generation limit reached ({quota.used}/{quota.limit}) — resets tomorrow
          </div>
        )}
        {error && <div className="mono text-2xs text-warn">{error}</div>}

        {/* Body: document/editor + ATS panel */}
        <div className="grid grid-cols-[1fr_280px] gap-5 max-lg:flex max-lg:flex-col">
          {editing && draft ? (
            <div className="flex flex-col gap-3">
              {aiDraftActive && (
                <div className="rounded-lg border border-line bg-surface px-4 py-3 mono text-2xs text-mute leading-relaxed">
                  AI applied ATS suggestions — review highlighted changes before saving. Saving will re-score ATS automatically.
                </div>
              )}
              <ResumeEditor value={draft} onChange={setDraft} changedPaths={aiChangedPaths} />
            </div>
          ) : (
            <div className="rounded-lg p-5 bg-bg-sub overflow-auto">
              <ResumeDocument content={selected.content} />
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* ATS score */}
            <div className="rounded-lg p-4 border border-line bg-surface flex items-center gap-3">
              <AtsScoreCircle score={selected.atsScore} />
              <div className="flex-1">
                <div className="font-medium text-ink text-[11px]">
                  ATS readability
                </div>
                <div className="text-[10px] text-mute leading-[1.4] mt-0.5">
                  {selected.atsIssues.length === 0
                    ? "No issues flagged."
                    : `${selected.atsIssues.length} suggestion${selected.atsIssues.length === 1 ? "" : "s"} to improve.`}
                </div>
              </div>
              {selected.atsIssues.length > 0 && !editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={improveAts}
                  disabled={busy}
                  className="mono text-ink border-line rounded-sm px-2 py-1 bg-bg hover:bg-bg-sub-2 flex items-center gap-1.5"
                >
                  <Sparkles size={11} /> {improving ? "applying…" : "apply with AI"}
                </Button>
              )}
            </div>

            {/* ATS issues */}
            {selected.atsIssues.length > 0 && (
              <div className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-3">
                <div className="mono text-2xs text-mute-2 uppercase tracking-mono">suggestions</div>
                {selected.atsIssues.map((issue, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${SEVERITY_BG[issue.severity]}`}
                      />
                      <span className="text-ink text-[10.5px]">
                        {issue.message}
                      </span>
                    </div>
                    <span className="text-[10px] text-mute leading-[1.4] pl-3">
                      {issue.fix}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {editing && (
              <div className="mono text-2xs text-mute-3">
                {aiDraftActive ? "save to apply this AI draft and re-score automatically." : "save your edits, then run “analyze ATS again” to re-score."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AtsScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80 ? "oklch(0.42 0.04 160)" : score >= 60 ? "var(--warn)" : "var(--mute-3)";
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0 w-[38px] h-[38px] border-2 font-bold text-[13px]"
      style={{ borderColor: color, color }}
    >
      {score}
    </div>
  );
}
