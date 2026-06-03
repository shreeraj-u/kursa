"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useId, useState } from "react";
import { CircleHelp, X } from "lucide-react";

import type { DashboardPageHelp } from "./page-help";

function HelpModal({ help, onClose }: { help: DashboardPageHelp; onClose: () => void }) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ background: "rgba(8, 10, 14, 0.42)" }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-xl p-5 shadow-2xl"
        style={{
          border: "1px solid var(--line-2)",
          background: "var(--surface)",
          color: "var(--ink)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <div className="mono mb-1 text-2xs uppercase tracking-mono text-mute-2">
              page guide
            </div>
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {help.title}
            </h2>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close page guide"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-bg-sub"
            style={{ border: "1px solid var(--line)", color: "var(--mute)" }}
          >
            <X size={14} />
          </button>
        </div>

        <p id={descriptionId} className="mb-4 text-sm leading-relaxed text-mute">
          {help.description}
        </p>

        <ol className="flex flex-col gap-2.5">
          {help.tips.map((tip, index) => (
            <li key={tip} className="flex gap-3 text-xs leading-relaxed text-mute">
              <span
                className="mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-line)",
                }}
              >
                {index + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>

        {help.guideHref && (
          <div className="mt-5 flex justify-end border-t border-line pt-3">
            <Link
              href={help.guideHref as Route}
              onClick={onClose}
              className="mono rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-bg-sub"
              style={{
                border: "1px solid var(--line-2)",
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              Open full guide
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PageHelpButton({
  help,
  label,
}: {
  help: DashboardPageHelp;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`How to use ${label}`}
        title={`How to use ${label}`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full align-middle transition-colors hover:bg-bg-sub"
        style={{
          color: "var(--mute)",
          border: "1px solid var(--line-2)",
          background: "var(--bg)",
          cursor: "pointer",
        }}
      >
        <CircleHelp size={14} />
      </button>
      {open && <HelpModal help={help} onClose={() => setOpen(false)} />}
    </>
  );
}
