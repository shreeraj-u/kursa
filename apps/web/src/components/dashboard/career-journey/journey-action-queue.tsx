"use client";

import type { JourneyActionItem } from "@kursa/types";
import type { Route } from "next";
import Link from "next/link";

interface Props {
  actionQueue: JourneyActionItem[];
}

const DOMAIN_LABEL: Record<string, string> = {
  path: "journey",
  skill: "skill",
  application: "app",
};

function ActionItem({ item }: { item: JourneyActionItem }) {
  return (
    <Link href={item.linkTo as Route} className="group block rounded-lg border border-line bg-surface p-3 hover:bg-bg-sub-2" style={{ textDecoration: "none" }}>
      <div className="flex items-start justify-between gap-3">
        <span className="mono rounded-sm border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute">
          {DOMAIN_LABEL[item.domain]}
        </span>
        {item.daysRemaining !== null && (
          <span className="mono shrink-0 text-2xs text-mute-3">
            {item.daysRemaining <= 0 ? "overdue" : `${item.daysRemaining}d`}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs font-medium text-ink group-hover:underline">{item.title}</div>
      <div className="mt-1 text-2xs leading-relaxed text-mute-2">{item.subtitle}</div>
    </Link>
  );
}

export default function JourneyActionQueue({ actionQueue }: Props) {
  const topActions = actionQueue.slice(0, 3);

  return (
    <aside className="rounded-xl border border-line bg-bg-sub p-4">
      <div className="mono text-2xs uppercase tracking-mono text-mute-2">next actions</div>
      <p className="mt-2 text-xs leading-relaxed text-mute-2">
        Use this after the current milestone. It only shows the highest-priority items.
      </p>

      {topActions.length === 0 ? (
        <div className="mt-4 rounded-lg border border-line bg-surface p-3">
          <p className="text-xs font-medium text-ink">No urgent actions.</p>
          <p className="mt-1 text-2xs leading-relaxed text-mute-2">Focus on the milestone on the left.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {topActions.map((item, i) => (
            <ActionItem key={`${item.domain}-${item.title}-${i}`} item={item} />
          ))}
        </div>
      )}
    </aside>
  );
}
