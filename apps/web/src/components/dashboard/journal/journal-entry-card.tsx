"use client";

import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";

import {
  displayEntryBody,
  formatTime,
  parseFeedbackStructured,
  parseWinStructured,
  TAG_ACCENT,
  tagDisplayLabel,
  type TimelineEntry,
} from "@/lib/dashboard/journal/journal-utils";

type Props = {
  entry: TimelineEntry;
  variant?: "timeline" | "win-card";
  highlight?: boolean;
  onSourceClick?: (eventId: string) => void;
};

export function JournalEntryCard({ entry, variant = "timeline", highlight }: Props) {
  const accent = TAG_ACCENT[entry.tag] ?? "var(--line)";
  const win = entry.tag === "win" ? parseWinStructured(entry.structured) : null;
  const feedback = entry.tag === "feedback" ? parseFeedbackStructured(entry.structured) : null;

  if ((variant === "win-card" || variant === "timeline") && win) {
    return (
      <motion.div
        id={`journal-entry-${entry.id}`}
        layout
        initial={highlight ? { backgroundColor: "var(--accent-soft)" } : false}
        animate={{ backgroundColor: "var(--surface)" }}
        transition={{ duration: 0.8 }}
        className="rounded-lg p-4"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <div
          className="mono mb-1"
          style={{ fontSize: 9, color: "var(--mute-2)", letterSpacing: "0.04em" }}
        >
          {tagDisplayLabel("win")} · {formatTime(entry.occurredAt)}
        </div>
        <div
          className="font-medium mb-1"
          style={{ fontSize: "var(--text-sm)", color: "var(--ink)", lineHeight: 1.4 }}
        >
          {win.title}
        </div>
        {win.body && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)", lineHeight: 1.55 }}>
            {win.body}
          </p>
        )}
        {win.skillNames && win.skillNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {win.skillNames.map((skill) => (
              <span
                key={skill}
                className="mono rounded-full px-2 py-0.5"
                style={{
                  fontSize: 9,
                  border: "1px solid var(--line)",
                  color: "var(--mute)",
                  background: "var(--bg-sub)",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  if (entry.agent) {
    return (
      <div
        id={`journal-entry-${entry.id}`}
        className="rounded-lg px-4 py-3 flex gap-3"
        style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
      >
        <span
          className="mono flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 18,
            height: 18,
            fontSize: 8,
            background: "oklch(0.42 0.04 160 / 0.12)",
            color: "oklch(0.42 0.04 160)",
            border: "1px solid oklch(0.42 0.04 160 / 0.25)",
          }}
        >
          A
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="mono" style={{ fontSize: 9, color: "oklch(0.42 0.04 160)" }}>
              aria noticed
            </span>
            <span className="mono" style={{ fontSize: 9, color: "var(--mute-3)" }}>
              {formatTime(entry.occurredAt)}
            </span>
          </div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink)", lineHeight: 1.55 }}>
            {entry.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`journal-entry-${entry.id}`}
      className="flex gap-3 py-3 px-1"
      style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="mono" style={{ fontSize: 9, color: accent, fontWeight: 600 }}>
            {tagDisplayLabel(entry.tag)}
          </span>
          <span className="mono" style={{ fontSize: 9, color: "var(--mute-3)" }}>
            {formatTime(entry.occurredAt)}
          </span>
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink)", lineHeight: 1.55 }}>
          {feedback ? `[${feedback.fromRole}] ${feedback.body}` : displayEntryBody(entry)}
        </p>
      </div>
    </div>
  );
}

type FeedProps = {
  entries: TimelineEntry[];
  variant?: "timeline" | "win-card";
  lane?: "all" | "user" | "aria";
  highlightId?: string | null;
  onLoad?: boolean;
};

export function JournalTimelineFeed({
  entries,
  variant = "timeline",
  lane = "all",
  highlightId,
  onLoad = true,
}: FeedProps) {
  const filtered =
    lane === "user"
      ? entries.filter((e) => !e.agent)
      : lane === "aria"
        ? entries.filter((e) => e.agent)
        : entries;

  if (filtered.length === 0) {
    return null;
  }

  return (
    <Stagger onLoad={onLoad} staggerDelay={0.04}>
      {filtered.map((entry) => (
        <StaggerItem key={entry.id}>
          <JournalEntryCard
            entry={entry}
            variant={variant}
            highlight={entry.id === highlightId}
          />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
