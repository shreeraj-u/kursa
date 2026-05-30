"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/dashboard/page-header";
import { api } from "@/lib/api";

type Tab = "log" | "wins" | "review" | "relevance";
type ComposeType = "win" | "note" | "checkin";

type Entry = {
  id: string;
  type: string;
  body: string | null;
  tag: string;
  agent: boolean;
  occurredAt: string;
};

type JournalContext = {
  statusLabel: string;
  company: string | null;
  roleTitle: string | null;
  tenureDays: number | null;
};

const BORDER_ACCENT: Record<string, string> = {
  win: "border-l-accent",
  checkin: "border-l-[var(--line-3)]",
  aria: "border-l-[var(--mute-2)]",
  note: "border-l-line-2",
  feedback: "border-l-warn",
};

function dayGroupLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entryDay = new Date(d);
  entryDay.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - entryDay.getTime()) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" }).toLowerCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function groupEntriesByDay(entries: Entry[]): Array<{ label: string; entries: Entry[] }> {
  const groups: Array<{ label: string; entries: Entry[] }> = [];
  let currentLabel: string | null = null;

  for (const entry of entries) {
    const label = dayGroupLabel(entry.occurredAt);
    if (label !== currentLabel) {
      groups.push({ label, entries: [entry] });
      currentLabel = label;
    } else {
      groups[groups.length - 1]!.entries.push(entry);
    }
  }

  return groups;
}

function EntryPill({ tag }: { tag: string }) {
  const isWin = tag === "win";
  return (
    <span
      className={`mono shrink-0 rounded-full border px-1.5 py-[1px] tracking-[0.03em] text-[9px] ${
        isWin
          ? "border-accent text-accent"
          : "border-line bg-bg-sub-2 text-mute-2"
      }`}
    >
      {tag}
    </span>
  );
}

function ComposeTypePill({
  type,
  label,
  active,
  onSelect,
}: {
  type: ComposeType;
  label: string;
  active: boolean;
  onSelect: (t: ComposeType) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`mono cursor-pointer rounded-full border px-2 py-[2px] tracking-[0.03em] text-[9px] transition-colors ${
        active
          ? type === "win"
            ? "border-accent text-accent"
            : "border-line-2 text-ink"
          : "border-line bg-bg-sub-2 text-mute-2 hover:text-mute"
      }`}
    >
      {label}
    </button>
  );
}

export default function JournalClient() {
  const [tab, setTab] = useState<Tab>("log");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [context, setContext] = useState<JournalContext | null>(null);
  const [trend, setTrend] = useState<Array<{ weekLabel: string; value: number }>>([]);
  const [relevance, setRelevance] = useState<Awaited<ReturnType<typeof api.journal.relevance>> | null>(null);
  const [reviewPrep, setReviewPrep] = useState<Awaited<ReturnType<typeof api.journal.reviewPrep>> | null>(null);
  const [checkIn, setCheckIn] = useState<Awaited<ReturnType<typeof api.checkins.next>> | null>(null);
  const [composeText, setComposeText] = useState("");
  const [composeType, setComposeType] = useState<ComposeType>("note");
  const [pulseEnergy, setPulseEnergy] = useState("");
  const [pulseChallenge, setPulseChallenge] = useState(3);
  const [pulseRemember, setPulseRemember] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadTimeline = useCallback((filter: "all" | "win" = "all") => {
    startTransition(async () => {
      try {
        const res = await api.journal.timeline({ filter });
        setEntries(res.data);
      } catch {
        toast.error("Could not load journal");
      }
    });
  }, []);

  useEffect(() => {
    loadTimeline(tab === "wins" ? "win" : "all");
    api.journal.context().then(setContext).catch(() => null);
    api.journal.trend().then((r) => setTrend(r.data)).catch(() => null);
    api.checkins.next().then(setCheckIn).catch(() => null);
  }, [loadTimeline, tab]);

  useEffect(() => {
    if (tab === "relevance") {
      api.journal.relevance().then(setRelevance).catch(() => null);
    }
    if (tab === "review") {
      api.journal.reviewPrep().then(setReviewPrep).catch(() => null);
    }
  }, [tab]);

  const groupedEntries = useMemo(() => groupEntriesByDay(entries), [entries]);

  const submitCompose = () => {
    const text = composeText.trim();
    if (!text) {
      toast.error("Write something first");
      return;
    }

    startTransition(async () => {
      try {
        if (composeType === "win") {
          const [firstLine, ...rest] = text.split("\n");
          const title = firstLine.trim();
          const body = (rest.length > 0 ? rest.join("\n") : firstLine).trim();
          await api.journal.createWin({ title, body });
        } else {
          await api.journal.createNote({ body: text });
        }
        setComposeText("");
        toast.success(composeType === "win" ? "Win logged" : "Entry saved");
        loadTimeline(tab === "wins" ? "win" : "all");
        api.journal.trend().then((r) => setTrend(r.data)).catch(() => null);
      } catch {
        toast.error("Could not save entry");
      }
    });
  };

  const submitPulse = () => {
    if (!pulseEnergy.trim()) {
      toast.error("Answer the first question");
      return;
    }
    startTransition(async () => {
      try {
        await api.checkins.submit({
          type: "checkin_weekly",
          responses: {
            energyFocus: pulseEnergy.trim(),
            challengeLevel: pulseChallenge,
            rememberThis: pulseRemember.trim() || undefined,
          },
        });
        setPulseEnergy("");
        setPulseRemember("");
        toast.success("Check-in saved");
        setCheckIn(await api.checkins.next());
        loadTimeline(tab === "wins" ? "win" : "all");
        api.journal.trend().then((r) => setTrend(r.data)).catch(() => null);
      } catch {
        toast.error("Could not save check-in");
      }
    });
  };

  const chipParts = [
    context?.statusLabel,
    context?.company,
    context?.tenureDays != null ? `${context.tenureDays} days` : null,
  ].filter(Boolean);

  const tabs: { id: Tab; label: string }[] = [
    { id: "log", label: "log" },
    { id: "wins", label: "wins" },
    { id: "review", label: "review prep" },
    { id: "relevance", label: "relevance" },
  ];

  const maxTrend = Math.max(...trend.map((p) => Math.abs(p.value)), 0.01);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Journal" />

      <div className="flex flex-col gap-5 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-ink">
              The work doesn&apos;t end at signing.
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">
              Wins captured, drift noticed, reflections kept.
            </p>
          </div>
          {chipParts.length > 0 && (
            <span className="chip mt-1.5 self-start">
              <span className="dot" />
              {chipParts.join(" · ")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          {/* Left — compose + feed */}
          <div className="flex flex-col gap-4">
            {(tab === "log" || tab === "wins") && (
              <div className="rounded-lg border border-line bg-surface p-4">
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  placeholder="capture a win, note, or reflection..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-line-2 bg-bg px-3 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-mute-3 focus:border-ink-3"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <ComposeTypePill
                      type="win"
                      label="win"
                      active={composeType === "win"}
                      onSelect={setComposeType}
                    />
                    <ComposeTypePill
                      type="note"
                      label="note"
                      active={composeType === "note"}
                      onSelect={setComposeType}
                    />
                    <ComposeTypePill
                      type="checkin"
                      label="checkin"
                      active={composeType === "checkin"}
                      onSelect={setComposeType}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn sm"
                    style={{ background: "var(--accent)", borderColor: "var(--accent)" }}
                    onClick={() => {
                      if (composeType === "checkin") {
                        setPulseEnergy(composeText.trim());
                        setComposeText("");
                        toast.message("Added to weekly pulse — finish and submit on the right");
                        return;
                      }
                      submitCompose();
                    }}
                    disabled={isPending}
                  >
                    {composeType === "win" ? "log win" : composeType === "checkin" ? "add to pulse" : "save entry"}
                  </button>
                </div>
                {composeType === "win" && (
                  <p className="mono mt-2 text-[9px] text-mute-3">
                    first line becomes the title · rest is the story
                  </p>
                )}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex border-b border-line px-4">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className="mono cursor-pointer bg-transparent py-2.5 px-3 text-[10.5px] capitalize"
                    style={{
                      color: tab === t.id ? "var(--ink)" : "var(--mute)",
                      borderBottom: tab === t.id ? "1.5px solid var(--ink)" : "1.5px solid transparent",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "review" && (
                <div className="p-5 text-sm leading-relaxed text-mute">
                  {reviewPrep?.sections.length ? (
                    reviewPrep.sections.map((s) => (
                      <div key={s.theme} className="mb-5">
                        <p className="mono mb-2 text-2xs text-mute-2">{s.theme}</p>
                        <ul className="list-disc space-y-1.5 pl-4">
                          {s.bullets.map((b, i) => (
                            <li key={`${s.theme}-${i}`}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p>Log wins and feedback to generate review prep.</p>
                  )}
                </div>
              )}

              {tab === "relevance" && (
                <div className="flex flex-col gap-3 p-5 text-sm text-mute">
                  {relevance ? (
                    <>
                      {relevance.pathAlignmentScore != null && (
                        <p>
                          Path alignment:{" "}
                          <strong className="text-ink">{relevance.pathAlignmentScore}%</strong>
                        </p>
                      )}
                      <p>
                        Wins this quarter:{" "}
                        <strong className="text-ink">{relevance.winsThisQuarter}</strong>
                      </p>
                      {relevance.staleSkills.length > 0 && (
                        <p>Skills going stale: {relevance.staleSkills.join(", ")}</p>
                      )}
                    </>
                  ) : (
                    <p>Loading relevance signals…</p>
                  )}
                </div>
              )}

              {(tab === "log" || tab === "wins") && (
                <div className="flex flex-col">
                  {entries.length === 0 && !isPending && (
                    <p className="p-5 text-sm text-mute-3">
                      Nothing written yet. Capture a win, note, or complete a weekly pulse.
                    </p>
                  )}

                  {groupedEntries.map((group) => (
                    <div key={group.label}>
                      <div className="flex items-center justify-between border-b border-line bg-bg-sub px-5 py-2">
                        <span className="mono text-2xs text-mute-2">{group.label}</span>
                      </div>

                      {group.entries.map((e) => {
                        const borderClass = BORDER_ACCENT[e.tag] ?? BORDER_ACCENT.aria;
                        return (
                          <article
                            key={e.id}
                            className={`border-b border-line px-5 py-4 last:border-b-0 border-l-2 ${borderClass} ${
                              e.agent ? "bg-bg" : "bg-surface"
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <EntryPill tag={e.tag} />
                              <span className="mono text-2xs text-mute-3">{formatTime(e.occurredAt)}</span>
                            </div>
                            <p className="text-[15px] leading-[1.65] text-ink-2">{e.body}</p>
                          </article>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {checkIn?.due && (
              <div className="rounded-lg border border-line bg-surface p-4">
                <p className="mono mb-3 text-2xs text-mute-2">weekly pulse</p>
                <div className="flex flex-col gap-3">
                  <textarea
                    value={pulseEnergy}
                    onChange={(e) => setPulseEnergy(e.target.value)}
                    placeholder="What took most of your energy this week?"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-line-2 bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-mute-3 focus:border-ink-3"
                  />
                  <label className="text-xs text-mute">
                    Challenge level (1–5): {pulseChallenge}
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={pulseChallenge}
                      onChange={(e) => setPulseChallenge(Number(e.target.value))}
                      className="mt-1.5 w-full accent-[var(--accent)]"
                    />
                  </label>
                  <input
                    value={pulseRemember}
                    onChange={(e) => setPulseRemember(e.target.value)}
                    placeholder="Anything to remember? (optional)"
                    className="w-full rounded-lg border border-line-2 bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-mute-3 focus:border-ink-3"
                  />
                  <button
                    type="button"
                    className="btn sm self-start"
                    style={{ background: "var(--accent)", borderColor: "var(--accent)" }}
                    onClick={submitPulse}
                    disabled={isPending}
                  >
                    submit pulse
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-line bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="mono text-2xs text-mute-2">engagement · last 12 weeks</span>
              </div>
              {trend.length > 0 ? (
                <div className="flex items-end gap-px" style={{ height: 18 }}>
                  {trend.map((p, i) => {
                    const normalized = Math.abs(p.value) / maxTrend;
                    const filled = normalized > 0.15;
                    return (
                      <i
                        key={`${p.weekLabel}-${i}`}
                        title={p.weekLabel}
                        className="not-italic flex-1 rounded-[1px]"
                        style={{
                          height: filled ? Math.max(4, normalized * 18) : 3,
                          background: filled ? "var(--accent)" : "var(--line)",
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-mute-3">
                  Complete check-ins to see your trend.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
