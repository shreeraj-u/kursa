"use client";

import type { JourneyActionItem, JourneyUrgency } from "@kursa/types";
import type { Route } from "next";
import Link from "next/link";

interface Props {
  actionQueue: JourneyActionItem[];
}

const DOMAIN_BADGE: Record<string, string> = {
  path: "journey",
  skill: "skill",
  application: "app",
};

const DOMAIN_COLOR: Record<string, string> = {
  path: "var(--accent)",
  skill: "#6366f1",
  application: "#059669",
};

const URGENCY_LABEL: Record<JourneyUrgency, string> = {
  urgent: "urgent",
  important: "important",
  later: "later",
};

const URGENCY_COLOR: Record<JourneyUrgency, string> = {
  urgent: "var(--warn)",
  important: "var(--accent)",
  later: "var(--mute-3)",
};

function ActionItem({ item }: { item: JourneyActionItem }) {
  return (
    <Link
      href={item.linkTo as Route}
      className="flex items-start gap-3 group"
      style={{ textDecoration: "none" }}
    >
      <span
        className="mono flex-shrink-0 rounded px-1.5 py-0.5"
        style={{
          fontSize: 9,
          marginTop: 2,
          background: `color-mix(in srgb, ${DOMAIN_COLOR[item.domain]} 12%, transparent)`,
          color: DOMAIN_COLOR[item.domain],
          border: `1px solid color-mix(in srgb, ${DOMAIN_COLOR[item.domain]} 25%, transparent)`,
        }}
      >
        {DOMAIN_BADGE[item.domain]}
      </span>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium group-hover:underline" style={{ color: "var(--ink)" }}>
          {item.title}
        </div>
        <div className="text-2xs mt-0.5 leading-relaxed" style={{ color: "var(--mute-2)" }}>
          {item.subtitle}
        </div>
      </div>

      {item.daysRemaining !== null && (
        <span
          className="mono text-2xs flex-shrink-0"
          style={{ color: item.daysRemaining <= 0 ? "var(--warn)" : "var(--mute-3)", marginTop: 2 }}
        >
          {item.daysRemaining <= 0 ? "overdue" : `${item.daysRemaining}d`}
        </span>
      )}
    </Link>
  );
}

function UrgencySection({ urgency, items }: { urgency: JourneyUrgency; items: JourneyActionItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div
        className="mono text-2xs mb-2 flex items-center gap-1.5"
        style={{ color: URGENCY_COLOR[urgency] }}
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 5, height: 5, background: URGENCY_COLOR[urgency] }}
        />
        {URGENCY_LABEL[urgency]}
      </div>
      <div className="flex flex-col gap-3 pl-3" style={{ borderLeft: `1px solid var(--line)` }}>
        {items.map((item, i) => (
          <ActionItem key={`${item.domain}-${item.title}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function JourneyActionQueue({ actionQueue }: Props) {
  const urgent = actionQueue.filter((i) => i.urgency === "urgent");
  const important = actionQueue.filter((i) => i.urgency === "important");
  const later = actionQueue.filter((i) => i.urgency === "later");

  return (
    <div
      className="rounded-lg p-5"
      style={{ border: "1px solid var(--line)", background: "var(--bg-sub)" }}
    >
      <div
        className="mono text-2xs mb-5 uppercase"
        style={{ color: "var(--mute-2)", letterSpacing: "0.06em" }}
      >
        action queue
      </div>

      {actionQueue.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <p className="text-xs" style={{ color: "var(--mute-3)" }}>You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <UrgencySection urgency="urgent" items={urgent} />
          <UrgencySection urgency="important" items={important} />
          <UrgencySection urgency="later" items={later} />
        </div>
      )}
    </div>
  );
}
