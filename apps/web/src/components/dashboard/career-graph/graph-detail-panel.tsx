"use client";

import Link from "next/link";
import type { Route } from "next";
import { X, ArrowUpRight } from "lucide-react";

import type { GraphNode, NodeKind } from "@/lib/dashboard/career-graph/types";
import { KIND_LABEL } from "@/lib/dashboard/career-graph/constants";

const DEEP_LINK_LABEL: Partial<Record<NodeKind, string>> = {
  skill: "Open in Skills",
  milestone: "Open in Career journey",
  role: "Open in Career journey",
  project: "Open in Resume studio",
  job: "Open in Resume studio",
  achievement: "Open in Resume studio",
  education: "Open in Resume studio",
};

export default function GraphDetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  return (
    <aside
      className="absolute right-0 top-0 z-20 flex h-full w-72 flex-col border-l"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="flex items-start justify-between border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
        <div>
          <div className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
            {KIND_LABEL[node.kind]}
            {node.kind === "skill" && node.skillState ? ` · ${node.skillState}` : ""}
          </div>
          <h2 className="mt-1 text-md font-medium" style={{ color: "var(--ink)" }}>
            {node.label}
          </h2>
          {node.sublabel && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--mute)" }}>
              {node.sublabel}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 transition-colors hover:bg-bg-sub-2"
          aria-label="Close"
        >
          <X size={14} style={{ color: "var(--mute)" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {node.hint && (
          <p
            className="mb-3 rounded-md border px-2.5 py-2 text-xs leading-relaxed"
            style={{ borderColor: "var(--line)", background: "var(--bg-sub)", color: "var(--ink-2)" }}
          >
            {node.hint}
          </p>
        )}
        {node.detail && node.detail.length > 0 ? (
          <dl className="space-y-2.5">
            {node.detail.map((d) => (
              <div key={d.label}>
                <dt className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
                  {d.label}
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mono text-2xs" style={{ color: "var(--mute-3)" }}>
            No further detail.
          </p>
        )}
      </div>

      {node.href && DEEP_LINK_LABEL[node.kind] && (
        <div className="border-t px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <Link
            href={node.href as Route}
            className="mono flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-bg-sub-2"
            style={{ borderColor: "var(--line-2)", color: "var(--ink)" }}
          >
            {DEEP_LINK_LABEL[node.kind]}
            <ArrowUpRight size={13} style={{ color: "var(--mute-2)" }} />
          </Link>
        </div>
      )}
    </aside>
  );
}
