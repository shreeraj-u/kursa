import type { FeedbackStructured, RelevanceSummary, WinStructured } from "@kursa/types";

export type JournalTab = "timeline" | "review";

/** Backend compose id; `win` maps to user-facing "accomplishment" */
export type ComposeType = "win" | "note" | "feedback" | "learning";

export type TimelineFilter = "all" | "accomplishments";

export type TimelineEntry = {
  id: string;
  type: string;
  source: string;
  body: string | null;
  structured: unknown;
  linkedSkillIds?: string[];
  tag: string;
  agent: boolean;
  occurredAt: string;
};

export type JournalContext = {
  statusLabel: string;
  company: string | null;
  roleTitle: string | null;
  tenureDays: number | null;
};

export type TrendPoint = { weekLabel: string; value: number; summary?: string };

export type RelevanceData = RelevanceSummary;

/** User-facing labels for backend tags / compose types */
export const TAG_DISPLAY_LABEL: Record<string, string> = {
  win: "accomplishment",
  note: "note",
  feedback: "feedback",
  checkin: "weekly pulse",
  aria: "aria noticed",
  decision: "decision",
  learning: "learning",
  application: "application",
};

export const COMPOSE_DISPLAY_LABEL: Record<ComposeType, string> = {
  note: "note",
  win: "accomplishment",
  feedback: "feedback",
  learning: "learning",
};

export function tagDisplayLabel(tag: string): string {
  return TAG_DISPLAY_LABEL[tag] ?? tag;
}

export const TAG_ACCENT: Record<string, string> = {
  win: "var(--accent)",
  checkin: "var(--mute-2)",
  note: "var(--mute-3)",
  feedback: "oklch(0.6 0.1 60)",
  aria: "oklch(0.42 0.04 160)",
  learning: "oklch(0.5 0.08 240)",
  decision: "oklch(0.55 0.06 300)",
};

export function parseWinStructured(structured: unknown): WinStructured | null {
  if (!structured || typeof structured !== "object") return null;
  const s = structured as WinStructured;
  if (typeof s.title !== "string") return null;
  return s;
}

export function parseFeedbackStructured(structured: unknown): FeedbackStructured | null {
  if (!structured || typeof structured !== "object") return null;
  const s = structured as FeedbackStructured;
  if (typeof s.body !== "string") return null;
  return s;
}

export function formatDayGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - day.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function groupByDay(entries: TimelineEntry[]): Map<string, TimelineEntry[]> {
  const map = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    const key = formatDayGroup(e.occurredAt);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

export function computeTrendLabel(points: TrendPoint[]): string {
  if (points.length < 4) return "building baseline";
  const first = points.slice(0, 4).reduce((s, p) => s + p.value, 0) / 4;
  const last = points.slice(-4).reduce((s, p) => s + p.value, 0) / 4;
  const delta = last - first;
  if (delta > 0.08) return "quiet uptick";
  if (delta < -0.08) return "slipping";
  return "holding steady";
}

export function dateRangeFromDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const REVIEW_RANGES = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
] as const;

export function displayEntryBody(entry: TimelineEntry): string {
  if (entry.tag === "win") {
    const win = parseWinStructured(entry.structured);
    if (win) {
      const parts = [win.title];
      if (win.body && win.body !== win.title) parts.push(win.body);
      return parts.join("\n");
    }
  }
  if (entry.tag === "feedback") {
    const fb = parseFeedbackStructured(entry.structured);
    if (fb) return `[${fb.fromRole}] ${fb.body}`;
  }
  return entry.body ?? "";
}
