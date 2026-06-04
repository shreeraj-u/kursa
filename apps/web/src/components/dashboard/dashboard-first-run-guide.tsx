"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { DASHBOARD_PAGE_HELP, type DashboardPageHelp } from "./page-help";

type GuideSlide =
  | {
      kind: "welcome";
      title: string;
      description: string;
    }
  | ({ kind: "page"; label: string } & DashboardPageHelp);

const PAGE_SLIDES: GuideSlide[] = [
  {
    kind: "welcome",
    title: "Welcome to your dashboard",
    description:
      "Here is how each current dashboard area helps turn your profile, journal, and job-search activity into next steps.",
  },
  { kind: "page", label: "Home", ...DASHBOARD_PAGE_HELP.home },
  { kind: "page", label: "Career journey", ...DASHBOARD_PAGE_HELP.careerJourney },
  { kind: "page", label: "Skills", ...DASHBOARD_PAGE_HELP.skills },
  { kind: "page", label: "Resume studio", ...DASHBOARD_PAGE_HELP.resume },
  { kind: "page", label: "Applications", ...DASHBOARD_PAGE_HELP.applications },
  { kind: "page", label: "Journal", ...DASHBOARD_PAGE_HELP.journal },
  { kind: "page", label: "Settings", ...DASHBOARD_PAGE_HELP.settings },
  { kind: "page", label: "Guide", ...DASHBOARD_PAGE_HELP.guide },
];

function StepDot({ active }: { active: boolean }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full transition-colors"
      style={{ background: active ? "var(--accent)" : "var(--line-2)" }}
    />
  );
}

export default function DashboardFirstRunGuide({
  shouldShow,
}: {
  shouldShow: boolean;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const slides = useMemo(() => PAGE_SLIDES, []);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (shouldShow) setOpen(true);
  }, [shouldShow]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        void dismiss();
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(slides.length - 1, current + 1));
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // dismiss intentionally omitted to avoid rebinding while pending state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slides.length]);

  if (!shouldShow || !open) return null;

  const slide = slides[index];
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  function dismiss() {
    if (isPending) return;

    startTransition(async () => {
      try {
        await api.dismissDashboardGuide();
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save guide dismissal");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) void dismiss();
      }}
      style={{ background: "rgba(8, 10, 14, 0.48)" }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-xl p-5 shadow-2xl"
        style={{
          border: "1px solid var(--line-2)",
          background: "var(--surface)",
          color: "var(--ink)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mono mb-1 text-2xs uppercase tracking-mono text-mute-2">
              dashboard guide · {index + 1}/{slides.length}
            </div>
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {slide.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void dismiss()}
            aria-label="Skip dashboard guide"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-bg-sub disabled:opacity-60"
            style={{ border: "1px solid var(--line)", color: "var(--mute)" }}
            disabled={isPending}
          >
            <X size={14} />
          </button>
        </div>

        <p id={descriptionId} className="mb-4 text-sm leading-relaxed text-mute">
          {slide.description}
        </p>

        {slide.kind === "page" && (
          <ol className="flex flex-col gap-2.5">
            {slide.tips.map((tip, tipIndex) => (
              <li key={tip} className="flex gap-3 text-xs leading-relaxed text-mute">
                <span
                  className="mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    border: "1px solid var(--accent-line)",
                  }}
                >
                  {tipIndex + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        )}

        {slide.kind === "welcome" && (
          <div
            className="rounded-lg p-4 text-xs leading-relaxed text-mute"
            style={{ border: "1px solid var(--line)", background: "var(--bg-sub)" }}
          >
            This guide appears once after onboarding and is saved to your account when you finish
            or skip it.
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {slides.map((item, slideIndex) => (
              <StepDot key={`${item.kind}-${slideIndex}`} active={slideIndex === index} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void dismiss()}
              className="mono rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-bg-sub disabled:opacity-60"
              style={{ border: "1px solid var(--line)", color: "var(--mute)" }}
              disabled={isPending}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              className="mono inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-bg-sub disabled:opacity-50"
              style={{ border: "1px solid var(--line-2)", color: "var(--ink)" }}
              disabled={isFirst || isPending}
            >
              <ArrowLeft size={12} />
              Back
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => void dismiss()}
                className="mono inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ border: "1px solid var(--accent-line)", background: "var(--accent)", color: "#fff" }}
                disabled={isPending}
              >
                <Check size={12} />
                Finish guide
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex((current) => Math.min(slides.length - 1, current + 1))}
                className="mono inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors hover:opacity-90"
                style={{ border: "1px solid var(--accent-line)", background: "var(--accent)", color: "#fff" }}
              >
                Next
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
