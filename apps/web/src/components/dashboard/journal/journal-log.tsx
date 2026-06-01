"use client";

import { JournalCollapsibleSection } from "./journal-collapsible-section";
import { JournalTimelineFeed } from "./journal-entry-card";
import {
  groupByDay,
  type JournalContext,
  type TimelineEntry,
  type TimelineFilter,
} from "@/lib/dashboard/journal/journal-utils";

type Props = {
  entries: TimelineEntry[];
  context: JournalContext | null;
  highlightId?: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  timelineFilter: TimelineFilter;
  onTimelineFilterChange: (f: TimelineFilter) => void;
  onLoadMore: () => void;
};

export function JournalTimelineTab({
  entries,
  context,
  highlightId,
  hasMore,
  loadingMore,
  timelineFilter,
  onTimelineFilterChange,
  onLoadMore,
}: Props) {
  const userEntries = entries.filter((e) => !e.agent);
  const ariaEntries = timelineFilter === "all" ? entries.filter((e) => e.agent) : [];
  const grouped = groupByDay(userEntries);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 mb-1">
        {(
          [
            { id: "all" as const, label: "all" },
            { id: "accomplishments" as const, label: "accomplishments" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTimelineFilterChange(id)}
            className="mono rounded px-2 py-1"
            style={{
              fontSize: 9,
              border: "1px solid",
              borderColor: timelineFilter === id ? "var(--accent-line)" : "var(--line)",
              background: timelineFilter === id ? "var(--accent-soft)" : "transparent",
              color: timelineFilter === id ? "var(--accent)" : "var(--mute)",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ border: "1px dashed var(--line)", background: "var(--bg-sub)" }}
        >
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink)", marginBottom: 4 }}>
            {timelineFilter === "accomplishments"
              ? "No accomplishments yet"
              : "Your timeline starts here"}
          </p>
          <p className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--mute-2)" }}>
            {context
              ? `${context.statusLabel}${context.company ? ` · ${context.company}` : ""}${context.tenureDays ? ` · ${context.tenureDays} days` : ""}`
              : "Jot a note or accomplishment to begin"}
          </p>
        </div>
      ) : (
        <>
          {userEntries.length > 0 && (
            <JournalCollapsibleSection
              title="your entries"
              count={userEntries.length}
              defaultOpen
              maxHeight={440}
            >
              <div className="flex flex-col gap-5">
                {[...grouped.entries()].map(([day, dayEntries]) => (
                  <section key={day}>
                    <div
                      className="mono mb-2"
                      style={{
                        fontSize: 9,
                        color: "var(--mute-2)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {day}
                    </div>
                    <JournalTimelineFeed entries={dayEntries} lane="all" highlightId={highlightId} />
                  </section>
                ))}

                {hasMore && (
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="mono rounded py-2 w-full"
                    style={{
                      fontSize: 9,
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      color: "var(--mute)",
                      cursor: loadingMore ? "wait" : "pointer",
                    }}
                  >
                    {loadingMore ? "loading…" : "load more"}
                  </button>
                )}
              </div>
            </JournalCollapsibleSection>
          )}

          {ariaEntries.length > 0 && (
            <JournalCollapsibleSection
              title="aria noticed"
              count={ariaEntries.length}
              defaultOpen={false}
              accentColor="oklch(0.42 0.04 160)"
              maxHeight={320}
            >
              <div className="flex flex-col gap-2">
                <JournalTimelineFeed entries={ariaEntries} lane="aria" highlightId={highlightId} />
              </div>
            </JournalCollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}

/** @deprecated use JournalTimelineTab */
export const JournalLogTab = JournalTimelineTab;
