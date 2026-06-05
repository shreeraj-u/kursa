"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/dashboard/page-header";
import { api } from "@/lib/api";

import { JournalCompose } from "./journal-compose";
import { JournalTimelineTab } from "./journal-log";
import { JournalReviewTab } from "./journal-review";
import { JournalSidebar } from "./journal-sidebar";
import type { ProactiveNudge, RelevanceSummary } from "@kursa/types";

import type {
  ComposeType,
  JournalContext,
  JournalTab,
  TimelineEntry,
  TimelineFilter,
} from "./journal-utils";

const TABS: Array<{ id: JournalTab; label: string }> = [
  { id: "timeline", label: "timeline" },
  { id: "review", label: "review prep" },
];

export default function JournalClient() {
  const [tab, setTab] = useState<JournalTab>("timeline");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [context, setContext] = useState<JournalContext | null>(null);
  const [relevance, setRelevance] = useState<RelevanceSummary | null>(null);
  const [relevanceLoading, setRelevanceLoading] = useState(true);
  const [memories, setMemories] = useState<
    Array<{ id: string; category: string; fact: string; confidence: number; validFrom: string }>
  >([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [nudges, setNudges] = useState<ProactiveNudge[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState<Awaited<ReturnType<typeof api.checkins.next>> | null>(null);
  const [composeText, setComposeText] = useState("");
  const [composeType, setComposeType] = useState<ComposeType>("note");
  const [feedbackRole, setFeedbackRole] = useState<"manager" | "peer" | "self">("peer");
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [impactMetric, setImpactMetric] = useState("");
  const [noteMood, setNoteMood] = useState(3);
  const [pulseResponses, setPulseResponses] = useState<Record<string, string | number>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const apiFilter = timelineFilter === "accomplishments" ? "win" : "all";

  const loadTimeline = useCallback(
    async (pageNum = 1, append = false) => {
      if (!append) setTimelineLoading(true);
      try {
        const res = await api.journal.timeline({ page: pageNum, filter: apiFilter });
        setEntries((prev) => (append ? [...prev, ...res.data] : res.data));
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not load journal";
        toast.error(msg.includes("Internal") ? "Could not load journal — try signing out and back in" : msg);
      } finally {
        if (!append) setTimelineLoading(false);
      }
    },
    [apiFilter],
  );

  const refreshIntelligence = useCallback(() => {
    setRelevanceLoading(true);
    api.journal
      .relevance()
      .then((r) => setRelevance(r))
      .catch(() => setRelevance(null))
      .finally(() => setRelevanceLoading(false));

    setMemoriesLoading(true);
    api.journal
      .memories()
      .then((r) => setMemories(r.data))
      .catch(() => setMemories([]))
      .finally(() => setMemoriesLoading(false));

    api.journal
      .proactive()
      .then((r) => setNudges(r.nudges))
      .catch(() => setNudges([]));
  }, []);

  useEffect(() => {
    if (tab !== "timeline") return;
    setPage(1);
    void loadTimeline(1, false);
  }, [tab, timelineFilter, loadTimeline]);

  useEffect(() => {
    api.journal.context().then(setContext).catch(() => null);
    api.journal.skills().then((r) => setAvailableSkills(r.skills)).catch(() => null);
    api.checkins.next().then(setCheckIn).catch(() => null);
    refreshIntelligence();

    if (typeof window !== "undefined") {
      localStorage.setItem("kursa-journal-last-visit", new Date().toISOString());
    }
  }, [refreshIntelligence]);

  const loadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    await loadTimeline(page + 1, true);
    setLoadingMore(false);
  };

  const refreshAfterSave = () => {
    if (tab === "timeline") void loadTimeline(1, false);
    refreshIntelligence();
  };

  const submitCompose = () => {
    const text = composeText.trim();
    if (!text) {
      toast.error("Write something first");
      return;
    }

    startTransition(async () => {
      try {
        let newId: string | undefined;
        if (composeType === "win") {
          const [firstLine, ...rest] = text.split("\n");
          const title = firstLine.trim();
          const body = (rest.length > 0 ? rest.join("\n") : firstLine).trim();
          const res = await api.journal.createWin({
            title,
            body,
            skillNames: skillNames.length > 0 ? skillNames : undefined,
            impactMetric: impactMetric.trim() || undefined,
          });
          newId = (res.event as { id?: string })?.id;
          setSkillNames([]);
          setImpactMetric("");
        } else if (composeType === "feedback") {
          const res = await api.journal.createFeedback({ body: text, fromRole: feedbackRole });
          newId = (res.event as { id?: string })?.id;
        } else if (composeType === "learning") {
          const res = await api.journal.createLearning({ skillName: text.trim() });
          newId = (res.event as { id?: string })?.id;
        } else {
          const res = await api.journal.createNote({ body: text, mood: noteMood });
          newId = (res.event as { id?: string })?.id;
        }
        setComposeText("");
        if (newId) setHighlightId(newId);
        toast.success("Entry saved");
        refreshAfterSave();
      } catch {
        toast.error("Could not save entry");
      }
    });
  };

  const submitPulse = () => {
    if (!checkIn?.type) return;

    const firstTextQ = checkIn.questions.find((q) => q.kind === "text");
    if (firstTextQ && !String(pulseResponses[firstTextQ.id] ?? "").trim()) {
      toast.error("Answer the first question");
      return;
    }

    startTransition(async () => {
      try {
        const responses = { ...pulseResponses };
        for (const q of checkIn.questions) {
          if (q.kind === "scale" && responses[q.id] === undefined) {
            responses[q.id] = 3;
          }
        }

        await api.checkins.submit({
          type: checkIn.type!,
          responses,
        });
        setPulseResponses({});
        toast.success(checkIn.type === "checkin_monthly" ? "Monthly review saved" : "Weekly pulse saved");
        setCheckIn(await api.checkins.next());
        refreshAfterSave();
      } catch {
        toast.error("Could not save check-in");
      }
    });
  };

  const scrollToEntry = (eventId: string) => {
    setTab("timeline");
    setHighlightId(eventId);
    setTimeout(() => {
      document.getElementById(`journal-entry-${eventId}`)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const chipParts = [
    context?.statusLabel,
    context?.roleTitle,
    context?.company,
    context?.tenureDays != null ? `${context.tenureDays} days` : null,
  ].filter(Boolean);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Journal" />

      <div className="flex flex-col gap-5 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-ink">Journal</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">
              Capture what happened — notes, accomplishments, feedback — so Kursa can help.
            </p>
            <Link
              href={"/dashboard/docs" as Route}
              className="mono mt-2 inline-block"
              style={{ fontSize: 9, color: "var(--mute-2)", textDecoration: "underline" }}
            >
              How does this work?
            </Link>
          </div>
          {chipParts.length > 0 && (
            <span className="chip mt-1.5 self-start">
              <span className="dot" />
              {chipParts.join(" · ")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4 min-w-0">
            <JournalCompose
              composeType={composeType}
              onComposeTypeChange={setComposeType}
              composeText={composeText}
              onComposeTextChange={setComposeText}
              onSubmit={submitCompose}
              saving={isPending}
              feedbackRole={feedbackRole}
              onFeedbackRoleChange={setFeedbackRole}
              skillNames={skillNames}
              onSkillNamesChange={setSkillNames}
              availableSkills={availableSkills}
              impactMetric={impactMetric}
              onImpactMetricChange={setImpactMetric}
              noteMood={noteMood}
              onNoteMoodChange={setNoteMood}
            />

            <div
              className="overflow-hidden rounded-lg"
              style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              <div
                className="flex px-4 relative"
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className="mono relative bg-transparent py-2.5 px-3 capitalize"
                    style={{
                      fontSize: 10.5,
                      color: tab === t.id ? "var(--ink)" : "var(--mute)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                    {tab === t.id && (
                      <motion.div
                        layoutId="journal-tab-underline"
                        className="absolute bottom-0 left-2 right-2"
                        style={{ height: 1.5, background: "var(--ink)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === "timeline" && (
                      <JournalTimelineTab
                        entries={entries}
                        context={context}
                        highlightId={highlightId}
                        hasMore={page < totalPages}
                        loadingMore={loadingMore}
                        timelineLoading={timelineLoading}
                        timelineFilter={timelineFilter}
                        onTimelineFilterChange={setTimelineFilter}
                        onLoadMore={() => void loadMore()}
                      />
                    )}
                    {tab === "review" && (
                      <JournalReviewTab onScrollToEntry={scrollToEntry} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <JournalSidebar
            relevance={relevance}
            relevanceLoading={relevanceLoading}
            memories={memories}
            memoriesLoading={memoriesLoading}
            nudges={nudges}
            checkIn={checkIn}
            pulseResponses={pulseResponses}
            onPulseResponseChange={(id, value) =>
              setPulseResponses((prev) => ({ ...prev, [id]: value }))
            }
            onSubmitPulse={submitPulse}
            pulseSaving={isPending}
          />
        </div>
      </div>
    </div>
  );
}
