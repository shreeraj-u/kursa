"use client";

import type { JourneyActiveProject } from "@kursa/types";
import Link from "next/link";
import type { Route } from "next";

interface Props {
  projects: JourneyActiveProject[];
  githubConnected?: boolean;
}

export default function JourneyActiveProjects({ projects, githubConnected }: Props) {
  if (projects.length === 0) {
    return (
      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="mono text-2xs uppercase tracking-mono text-mute-2">active projects</div>
        <p className="mt-2 text-xs leading-relaxed text-mute-2">
          {githubConnected
            ? "No repos with recent pushes — start building or accept a GitHub project proposal in Settings."
            : "Connect GitHub in Settings for live repo activity, or add projects to your profile."}
        </p>
        {!githubConnected && (
          <Link
            href={"/dashboard/settings" as Route}
            className="mt-3 inline-block text-xs text-accent hover:underline"
          >
            Connect GitHub →
          </Link>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="mono text-2xs uppercase tracking-mono text-mute-2">active projects</div>
        <span className="mono text-2xs text-mute-3">{projects.length} repo{projects.length === 1 ? "" : "s"}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-mute-2">
        What you are building now — from GitHub activity and accepted profile projects.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-lg border border-line bg-bg-sub p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-medium text-ink truncate">{project.title}</h3>
                  {project.source === "github" && (
                    <span className="mono rounded border border-line px-1.5 py-px text-2xs text-mute-2">github</span>
                  )}
                  {project.linkedMilestoneOrder != null && (
                    <span className="mono rounded border border-[var(--accent-line)] bg-[var(--accent-soft)] px-1.5 py-px text-2xs text-accent">
                      m{project.linkedMilestoneOrder}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-2xs text-mute-2">{project.activityLabel}</p>
              </div>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono shrink-0 text-2xs text-accent hover:underline"
                >
                  view
                </a>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {project.language && (
                <span className="mono text-2xs text-mute-3">{project.language}</span>
              )}
              {project.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-line bg-bg-sub-2 px-1.5 py-px text-2xs text-mute-2"
                >
                  {topic}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
