"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { HelpCircle, X } from "lucide-react";

import type { CareerJourney, UserProfile } from "@kursa/types";

import PageHeader from "@/components/dashboard/page-header";
import { buildGraph } from "@/lib/dashboard/career-graph/build-graph";
import { SKILL_STATE_COLOR } from "@/lib/dashboard/career-graph/constants";
import type { GraphPathStep, NodeKind, SkillState } from "@/lib/dashboard/career-graph/types";

import GraphCanvas from "./graph-canvas";
import GraphDetailPanel from "./graph-detail-panel";

interface CareerGraphPageProps {
  profile: UserProfile | null;
  journey: CareerJourney | null;
}

const INTRO_KEY = "kursa-career-graph-intro";

const SKILL_FILTERS: Array<{ state: SkillState; label: string }> = [
  { state: "owned", label: "owned" },
  { state: "gap", label: "gaps" },
  { state: "dormant", label: "dormant" },
  { state: "building", label: "building" },
];

const ENTITY_FILTERS: Array<{ kind: NodeKind; label: string }> = [
  { kind: "project", label: "projects" },
  { kind: "job", label: "work" },
  { kind: "achievement", label: "achievements" },
  { kind: "education", label: "education" },
];

export default function CareerGraphPage({ profile, journey }: CareerGraphPageProps) {
  const data = useMemo(() => buildGraph(profile, journey), [profile, journey]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenSkillStates, setHiddenSkillStates] = useState<Set<SkillState>>(new Set());
  const [hiddenKinds, setHiddenKinds] = useState<Set<NodeKind>>(new Set());
  const [gapsOnly, setGapsOnly] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  // Show the intro once per browser, until dismissed.
  useEffect(() => {
    if (localStorage.getItem(INTRO_KEY) !== "done") setShowIntro(true);
  }, []);

  function dismissIntro() {
    localStorage.setItem(INTRO_KEY, "done");
    setShowIntro(false);
  }

  const selectedNode = useMemo(
    () => data.nodes.find((n) => n.id === selectedId) ?? null,
    [data.nodes, selectedId],
  );

  function toggleSkillState(s: SkillState) {
    setHiddenSkillStates((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }
  function toggleKind(k: NodeKind) {
    setHiddenKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const empty = data.nodes.length <= 1;

  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col">
      <PageHeader pageTitle="Career graph" />

      {/* Stat strip */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-8 py-2.5"
        style={{ borderColor: "var(--line)" }}
      >
        <Stat label="skills" value={data.stats.skills} />
        <Stat label="gaps" value={data.stats.gaps} accent="var(--warn)" />
        <Stat label="dormant" value={data.stats.dormant} />
        <Stat label="building" value={data.stats.building} accent={SKILL_STATE_COLOR.building} />
        <Stat label="milestones" value={data.stats.milestones} />

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="mono flex items-center gap-1 rounded-md border px-2 py-1 text-2xs transition-colors"
            style={{ borderColor: "var(--line-2)", color: "var(--mute)" }}
          >
            <HelpCircle size={11} style={{ color: "var(--mute-2)" }} />
            how to read this
          </button>
          <button
            type="button"
            onClick={() => setGapsOnly((v) => !v)}
            className="mono rounded-md border px-2 py-1 text-2xs transition-colors"
            style={{
              borderColor: gapsOnly ? "var(--warn)" : "var(--line-2)",
              background: gapsOnly ? "color-mix(in srgb, var(--warn) 14%, transparent)" : "transparent",
              color: gapsOnly ? "var(--warn)" : "var(--mute)",
            }}
          >
            gaps only
          </button>
          {SKILL_FILTERS.map((f) => (
            <FilterChip
              key={f.state}
              label={f.label}
              color={SKILL_STATE_COLOR[f.state]}
              active={!hiddenSkillStates.has(f.state)}
              onClick={() => toggleSkillState(f.state)}
            />
          ))}
          {ENTITY_FILTERS.map((f) => (
            <FilterChip
              key={f.kind}
              label={f.label}
              active={!hiddenKinds.has(f.kind)}
              onClick={() => toggleKind(f.kind)}
            />
          ))}
        </div>
      </div>

      {/* Canvas region */}
      <div className="relative min-h-0 flex-1">
        {empty ? (
          <EmptyState hasProfile={Boolean(profile)} />
        ) : (
          <>
            {!data.hasJourney && <NoJourneyBanner />}
            <GraphCanvas
              data={data}
              selectedId={selectedId}
              onSelect={setSelectedId}
              hiddenKinds={hiddenKinds}
              hiddenSkillStates={hiddenSkillStates}
              gapsOnly={gapsOnly}
            />
            {data.hasJourney && data.pathSteps.length > 1 && (
              <PathReader
                steps={data.pathSteps}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
              />
            )}
            {selectedNode && <GraphDetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />}
            {showIntro && <IntroOverlay stats={data.stats} hasJourney={data.hasJourney} onClose={dismissIntro} />}
          </>
        )}
      </div>
    </div>
  );
}

function PathReader({
  steps,
  selectedId,
  onSelect,
}: {
  steps: GraphPathStep[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const milestones = steps.filter((s) => s.kind === "milestone");
  const totalGaps = milestones.reduce((sum, s) => sum + s.gapSkills.length, 0);

  return (
    <aside
      className="absolute left-4 top-4 z-20 w-[min(22rem,calc(100%-2rem))] overflow-hidden rounded-xl border shadow-sm"
      style={{
        borderColor: "var(--line)",
        background: "color-mix(in srgb, var(--surface) 94%, transparent)",
      }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
        <div className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
          Path reader
        </div>
        <h2 className="mt-1 text-sm font-medium" style={{ color: "var(--ink)" }}>
          Follow the thick line from today to the target role.
        </h2>
        <p className="mt-1 text-2xs leading-relaxed" style={{ color: "var(--mute)" }}>
          Click a step to spotlight its connected skills. Amber counts are missing skills that block that step.
        </p>
      </div>

      <ol className="max-h-[48svh] overflow-y-auto px-3 py-2">
        {steps.map((step, index) => {
          const active = selectedId === step.id;
          const isMilestone = step.kind === "milestone";
          const badge =
            step.kind === "you" ? "Now" : step.kind === "role" ? "Goal" : String(milestones.findIndex((m) => m.id === step.id) + 1);

          return (
            <li key={step.id} className="relative pl-7">
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[0.8rem] top-7 h-[calc(100%-0.25rem)] w-px"
                  style={{ background: "var(--accent-line)" }}
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className="group mb-1.5 flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-all"
                style={{
                  borderColor: active ? "var(--accent-line)" : "transparent",
                  background: active ? "var(--accent-soft)" : "transparent",
                }}
              >
                <span
                  className="mono absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[9px]"
                  style={{
                    border: `1px solid ${step.gapSkills.length ? "var(--warn)" : "var(--accent-line)"}`,
                    background: step.kind === "role" ? "var(--accent)" : "var(--surface)",
                    color: step.kind === "role" ? "white" : step.gapSkills.length ? "var(--warn)" : "var(--accent)",
                  }}
                >
                  {badge}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium" style={{ color: "var(--ink)" }}>
                    {step.label}
                  </span>
                  {step.sublabel && (
                    <span className="mono mt-0.5 block text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
                      {step.sublabel}
                    </span>
                  )}
                  {isMilestone && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      <MiniPill color={step.gapSkills.length ? "var(--warn)" : "var(--accent)"}>
                        {step.gapSkills.length ? `${step.gapSkills.length} gap${step.gapSkills.length === 1 ? "" : "s"}` : "no gaps"}
                      </MiniPill>
                      {step.requiredSkills.slice(0, 2).map((skill) => (
                        <MiniPill key={skill}>{skill}</MiniPill>
                      ))}
                      {step.requiredSkills.length > 2 && <MiniPill>+{step.requiredSkills.length - 2}</MiniPill>}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-t px-4 py-2" style={{ borderColor: "var(--line)", background: "var(--bg-sub)" }}>
        <p className="text-2xs leading-relaxed" style={{ color: "var(--mute)" }}>
          {totalGaps > 0 ? (
            <>
              Start with the first amber step: it shows the missing skills most likely to unlock the next move.
            </>
          ) : (
            <>No missing milestone skills found. Use this graph to keep evidence and projects connected to the path.</>
          )}
        </p>
      </div>
    </aside>
  );
}

function MiniPill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="mono rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-mono"
      style={{
        borderColor: color ? "color-mix(in srgb, currentColor 34%, transparent)" : "var(--line)",
        color: color ?? "var(--mute)",
        background: color ? "color-mix(in srgb, currentColor 10%, transparent)" : "transparent",
      }}
    >
      {children}
    </span>
  );
}

function IntroOverlay({
  stats,
  hasJourney,
  onClose,
}: {
  stats: { gaps: number; skills: number; milestones: number };
  hasJourney: boolean;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--bg) 60%, transparent)" }}>
      <div
        className="relative w-full max-w-md rounded-xl border p-5 shadow-lg"
        style={{ borderColor: "var(--line-2)", background: "var(--surface)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 transition-colors hover:bg-bg-sub-2"
          aria-label="Close"
        >
          <X size={14} style={{ color: "var(--mute)" }} />
        </button>

        <div className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
          How to read your Career Graph
        </div>
        <h2 className="mt-1.5 text-lg font-medium" style={{ color: "var(--ink)" }}>
          Your whole career, as one map
        </h2>

        <ul className="mt-3 flex flex-col gap-2.5">
          <IntroPoint num="1">
            Start with the <strong>Path reader</strong> card. It lists your route in plain order: <strong>you today</strong>, each{" "}
            <strong>milestone</strong>, then the <strong>target role</strong>.
          </IntroPoint>
          <IntroPoint num="2">
            The thick animated line is the same route on the graph. Amber spokes point from a milestone to{" "}
            <strong style={{ color: "var(--warn)" }}>missing skills</strong>; solid faint spokes are supporting career evidence.
          </IntroPoint>
          <IntroPoint num="3">
            <strong>Click any path step</strong> to spotlight what feeds it. Use <strong>"gaps only"</strong> when you just want the blockers.
          </IntroPoint>
        </ul>

        <div className="mt-4 rounded-md border px-3 py-2" style={{ borderColor: "var(--line)", background: "var(--bg-sub)" }}>
          <span className="text-xs" style={{ color: "var(--ink-2)" }}>
            {hasJourney ? (
              <>
                Right now you have <strong style={{ color: "var(--warn)" }}>{stats.gaps} skill gap{stats.gaps === 1 ? "" : "s"}</strong> across{" "}
                {stats.milestones} milestone{stats.milestones === 1 ? "" : "s"}. Closing them moves you toward your target role.
              </>
            ) : (
              <>You don't have a Career Journey yet, so there's no path or gaps. Generate one to light up your trajectory.</>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mono mt-4 w-full rounded-md px-3 py-2 text-xs"
          style={{ background: "var(--accent)", color: "white" }}
        >
          Got it — show me
        </button>
      </div>
    </div>
  );
}

function IntroPoint({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span
        className="mono flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs"
        style={{ background: "var(--bg-sub-2)", border: "1px solid var(--line-2)", color: "var(--mute)" }}
      >
        {num}
      </span>
      <span className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
        {children}
      </span>
    </li>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-md font-medium tabular-nums" style={{ color: accent ?? "var(--ink)" }}>
        {value}
      </span>
      <span className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
        {label}
      </span>
    </div>
  );
}

function FilterChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono flex items-center gap-1 rounded-md border px-2 py-1 text-2xs transition-all"
      style={{
        borderColor: active ? "var(--line-2)" : "var(--line)",
        color: active ? "var(--ink-2)" : "var(--mute-3)",
        background: "transparent",
        opacity: active ? 1 : 0.55,
      }}
    >
      {color && (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: color, display: "inline-block" }} />
      )}
      {label}
    </button>
  );
}

function NoJourneyBanner() {
  return (
    <div
      className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md border px-3 py-1.5"
      style={{ borderColor: "var(--accent-line)", background: "var(--accent-soft)" }}
    >
      <span className="mono text-2xs" style={{ color: "var(--ink-2)" }}>
        No journey yet — showing your identity.{" "}
        <Link href={"/dashboard/career-journey" as Route} className="underline" style={{ color: "var(--accent)" }}>
          Generate a Career Journey
        </Link>{" "}
        to project your trajectory and reveal skill gaps.
      </span>
    </div>
  );
}

function EmptyState({ hasProfile }: { hasProfile: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
        Career graph
      </div>
      <p className="max-w-sm text-sm" style={{ color: "var(--mute)" }}>
        {hasProfile
          ? "Your profile is still thin. Add skills, projects, and generate a Career Journey to grow your graph."
          : "We couldn't load your profile. Try refreshing."}
      </p>
      {hasProfile && (
        <Link
          href={"/dashboard/skills" as Route}
          className="mono rounded-md border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--line-2)", color: "var(--ink)" }}
        >
          Go to Skills
        </Link>
      )}
    </div>
  );
}
