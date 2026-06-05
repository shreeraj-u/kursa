"use client";

import type { JourneySuggestedProject } from "@kursa/types";
import Link from "next/link";
import type { Route } from "next";

interface Props {
  suggestions: JourneySuggestedProject[];
}

const EFFORT_LABEL: Record<JourneySuggestedProject["effort"], string> = {
  small: "small effort",
  medium: "medium effort",
  large: "large effort",
};

const SOURCE_LABEL: Record<JourneySuggestedProject["source"], string> = {
  journey: "journey",
  github_patterns: "github",
  market: "market",
};

export default function JourneySuggestedProjects({ suggestions }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-xl border border-line bg-bg-sub p-5">
      <div className="mono text-2xs uppercase tracking-mono text-mute-2">suggested projects</div>
      <p className="mt-2 text-xs leading-relaxed text-mute-2">
        Build next — tied to your journey milestones, GitHub patterns, and skill gaps.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {suggestions.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-line bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-ink">{item.title}</h3>
              <span className="mono shrink-0 text-2xs text-mute-3">{EFFORT_LABEL[item.effort]}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-mute-2">{item.rationale}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mono rounded border border-line px-1.5 py-px text-2xs text-mute-2">
                {SOURCE_LABEL[item.source]}
              </span>
              {item.targetMilestoneOrder != null && (
                <span className="mono rounded border border-[var(--accent-line)] bg-[var(--accent-soft)] px-1.5 py-px text-2xs text-accent">
                  milestone {item.targetMilestoneOrder}
                </span>
              )}
              {item.suggestedSkills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute-2"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={"/dashboard/skills" as Route}
                className="mono rounded border border-line px-2 py-1 text-2xs text-mute-2 hover:bg-bg-sub"
              >
                add skills
              </Link>
              <Link
                href={"/dashboard/settings" as Route}
                className="mono rounded border border-line px-2 py-1 text-2xs text-mute-2 hover:bg-bg-sub"
              >
                start project
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
