import type { ChatDecisionType, ConversationListItem } from "@kursa/types";

export const DECISION_TYPES: Array<{ value: ChatDecisionType; label: string }> = [
  { value: "offer_evaluation", label: "Offer evaluation" },
  { value: "promotion_timing", label: "Promotion timing" },
  { value: "negotiation", label: "Negotiation" },
  { value: "education", label: "Education" },
  { value: "general", label: "General decision" },
];

export type ThreadGroup = "this week" | "this month" | "older";

export function groupThreads(conversations: ConversationListItem[]): Record<ThreadGroup, ConversationListItem[]> {
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;

  const groups: Record<ThreadGroup, ConversationListItem[]> = {
    "this week": [],
    "this month": [],
    older: [],
  };

  for (const c of conversations) {
    const t = new Date(c.updatedAt).getTime();
    if (t >= weekAgo) groups["this week"].push(c);
    else if (t >= monthAgo) groups["this month"].push(c);
    else groups.older.push(c);
  }

  return groups;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isMainThread(c: ConversationListItem): boolean {
  return c.decisionType === null;
}
