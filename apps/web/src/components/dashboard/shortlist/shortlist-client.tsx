"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  Gauge,
  MapPin,
  RefreshCcw,
  Route as RouteIcon,
  SendHorizonal,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";
import { Button } from "@kursa/ui/components/button";

type WorkPreference = "startup" | "corporate" | "remote" | "hybrid" | undefined;
type AgentStatus = "idle" | "selecting" | "tailoring" | "drafting" | "checking" | "queued";

type DemoRole = {
  id: string;
  company: string;
  logo: string;
  title: string;
  location: string;
  workMode: string;
  salary: string;
  fit: number;
  strategic: number;
  connection: number;
  velocity: "fast" | "steady" | "stretch";
  reason: string;
  evidence: string[];
  agentNote: string;
  selected: boolean;
};

const DEMO_ROLES: DemoRole[] = [
  {
    id: "linear-em-core",
    company: "Linear",
    logo: "L",
    title: "Engineering Manager, Core Product",
    location: "Singapore / Remote APAC",
    workMode: "hybrid-friendly",
    salary: "$190–230k",
    fit: 86,
    strategic: 94,
    connection: 72,
    velocity: "fast",
    reason: "Best bridge from senior IC proof into a first formal EM seat without leaving product engineering.",
    evidence: ["systems leadership", "product judgment", "team rituals"],
    agentNote: "Lead with platform ownership + mentorship evidence; tailor résumé toward roadmap influence.",
    selected: true,
  },
  {
    id: "ramp-money-movement",
    company: "Ramp",
    logo: "R",
    title: "Engineering Manager, Money Movement",
    location: "New York / Remote",
    workMode: "remote ok",
    salary: "$210–250k",
    fit: 82,
    strategic: 91,
    connection: 63,
    velocity: "fast",
    reason: "Closest story match: fintech depth plus enough scope to make the leadership transition legible.",
    evidence: ["ledger systems", "cross-functional delivery", "incident ownership"],
    agentNote: "Draft cover note around reliability, payments domain credibility, and calm execution under ambiguity.",
    selected: true,
  },
  {
    id: "vercel-build-platform",
    company: "Vercel",
    logo: "V",
    title: "Staff Engineer, Build Platform",
    location: "Remote global",
    workMode: "remote-first",
    salary: "$200–240k",
    fit: 89,
    strategic: 78,
    connection: 55,
    velocity: "steady",
    reason: "A strong stepping-stone role if the safer path is staff-level leverage before people management.",
    evidence: ["developer platforms", "performance work", "technical strategy"],
    agentNote: "Position as the IC variant of the journey; keep application separate from EM-forward materials.",
    selected: true,
  },
  {
    id: "render-infra-lead",
    company: "Render",
    logo: "r",
    title: "Senior Tech Lead, Infrastructure",
    location: "Remote US / APAC overlap",
    workMode: "remote ok",
    salary: "$180–220k",
    fit: 84,
    strategic: 82,
    connection: 48,
    velocity: "steady",
    reason: "A tech-lead role with visible promotion path into EM if the timeline can stay flexible.",
    evidence: ["infra projects", "operational maturity", "technical mentoring"],
    agentNote: "Ask agent to emphasize durable systems work and measurable reliability outcomes.",
    selected: true,
  },
  {
    id: "figma-collab-systems",
    company: "Figma",
    logo: "F",
    title: "Engineering Manager, Collaboration Systems",
    location: "San Francisco / Hybrid",
    workMode: "relocation likely",
    salary: "$220–270k",
    fit: 74,
    strategic: 96,
    connection: 31,
    velocity: "stretch",
    reason: "A reach role that aligns tightly with the destination, but needs stronger people-management proof.",
    evidence: ["product craft", "distributed systems", "design partner fluency"],
    agentNote: "Queue only if user wants one stretch application; agent should flag leadership evidence gaps.",
    selected: false,
  },
];

const STATUS_COPY: Record<AgentStatus, { title: string; detail: string }> = {
  idle: {
    title: "Agents ready",
    detail: "Choose the roles worth pursuing. Agents prepare the packet; you review before anything is sent.",
  },
  selecting: {
    title: "Selecting evidence",
    detail: "Matching profile history, achievements, and journey gaps to each selected role.",
  },
  tailoring: {
    title: "Tailoring materials",
    detail: "Creating role-specific résumé emphasis and application notes from existing Profile evidence.",
  },
  drafting: {
    title: "Drafting outreach",
    detail: "Writing concise recruiter notes and review checklists for the selected companies.",
  },
  checking: {
    title: "Checking packets",
    detail: "Running a final truthfulness pass so each draft stays grounded in your Profile.",
  },
  queued: {
    title: "Queued for review",
    detail: "Application packets are staged. The human review/send boundary is preserved.",
  },
};

const STEPS: Array<{ key: Exclude<AgentStatus, "idle">; label: string; icon: ElementType }> = [
  { key: "selecting", label: "select evidence", icon: ShieldCheck },
  { key: "tailoring", label: "tailor résumé", icon: FileText },
  { key: "drafting", label: "draft outreach", icon: SendHorizonal },
  { key: "checking", label: "truth check", icon: ShieldCheck },
  { key: "queued", label: "queue review", icon: CheckCircle2 },
];

function preferenceLabel(value: WorkPreference) {
  if (value === "remote") return "Remote-first";
  if (value === "hybrid") return "Hybrid preferred";
  if (value === "startup") return "Startup-leaning";
  if (value === "corporate") return "Enterprise-friendly";
  return "Flexible work mode";
}

function scoreTone(score: number) {
  if (score >= 88) return "text-good";
  if (score >= 78) return "text-accent";
  return "text-warn";
}

function statusRank(status: AgentStatus) {
  return ["idle", "selecting", "tailoring", "drafting", "checking", "queued"].indexOf(status);
}

export default function ShortlistClient({
  location,
  activeJourneyTitle,
  workPreference,
}: {
  location: string;
  activeJourneyTitle: string;
  workPreference?: WorkPreference;
}) {
  const [roles, setRoles] = useState(DEMO_ROLES);
  const [status, setStatus] = useState<AgentStatus>("idle");

  const selectedRoles = useMemo(() => roles.filter((role) => role.selected), [roles]);
  const selectedCount = selectedRoles.length;
  const averageFit = Math.round(selectedRoles.reduce((sum, role) => sum + role.fit, 0) / Math.max(selectedCount, 1));
  const strategicAverage = Math.round(
    selectedRoles.reduce((sum, role) => sum + role.strategic, 0) / Math.max(selectedCount, 1),
  );
  const statusInfo = STATUS_COPY[status];
  const busy = status !== "idle" && status !== "queued";
  const progress = status === "idle" ? 0 : status === "selecting" ? 18 : status === "tailoring" ? 43 : status === "drafting" ? 68 : status === "checking" ? 86 : 100;

  function toggleRole(id: string) {
    if (busy) return;
    setRoles((current) => current.map((role) => (role.id === id ? { ...role, selected: !role.selected } : role)));
    if (status === "queued") setStatus("idle");
  }

  function queueAgents() {
    if (selectedCount === 0 || busy) return;
    setStatus("selecting");
    window.setTimeout(() => setStatus("tailoring"), 1400);
    window.setTimeout(() => setStatus("drafting"), 3300);
    window.setTimeout(() => setStatus("checking"), 5200);
    window.setTimeout(() => setStatus("queued"), 6800);
  }

  function resetDemo() {
    setStatus("idle");
    setRoles(DEMO_ROLES);
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Shortlist" />
      <div className="px-8 pt-6 pb-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <header className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_20%_20%,oklch(0.42_0.04_160/0.18),transparent_35%),linear-gradient(135deg,transparent,oklch(0.6_0.1_60/0.10))] lg:block" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tighter text-ink">Strategic shortlist</h1>
                  <PageHelpButton help={DASHBOARD_PAGE_HELP.shortlist} label="Shortlist" />
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">
                  A demo-ready view of roles filtered by where you are now and where your Career Journey is pointing — curated for motion, not volume.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ContextChip icon={MapPin} label="based near" value={location} />
                <ContextChip icon={RouteIcon} label="journey" value={activeJourneyTitle} />
                <ContextChip icon={Users} label="mode" value={preferenceLabel(workPreference)} />
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Metric label="curated roles" value="12" detail="5 shown for demo" />
            <Metric label="selected" value={selectedCount.toString()} detail="agent packets" />
            <Metric label="current fit" value={`${averageFit}%`} detail="avg selected" tone={scoreTone(averageFit)} />
            <Metric label="strategic value" value={`${strategicAverage}%`} detail="path alignment" tone={scoreTone(strategicAverage)} />
          </section>

          <main className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="flex flex-col gap-3">
              <div className="rounded-xl border border-line bg-bg-sub p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
                    <span className="mono text-2xs uppercase tracking-mono text-mute-2">job api filter</span>
                    <Pill>within current location</Pill>
                    <Pill>active Career Journey</Pill>
                    <Pill>quality over volume</Pill>
                  </div>
                  <div className="mono flex items-center gap-1.5 text-2xs text-mute-2">
                    <RefreshCcw size={11} /> demo refresh · 4 min ago
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {roles.map((role, index) => (
                  <RoleCard key={role.id} role={role} rank={index + 1} busy={busy} onToggle={() => toggleRole(role.id)} />
                ))}
              </div>
            </section>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <div className="border-b border-line bg-ink p-4 text-bg">
                  <div className="mono flex items-center justify-between text-2xs uppercase tracking-mono text-bg/60">
                    <span>agent apply room</span>
                    <span>{selectedCount} selected</span>
                  </div>
                  <div className="mt-4 flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full border border-bg/20 bg-bg/10">
                      <Bot size={18} className={busy ? "animate-pulse" : undefined} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold tracking-tight">{statusInfo.title}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-bg/70">{statusInfo.detail}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg/15">
                        <div
                          className="h-full rounded-full bg-bg transition-all duration-700 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2">
                    {STEPS.map((step) => {
                      const Icon = step.icon;
                      const complete = statusRank(status) > statusRank(step.key) || status === "queued";
                      const active = status === step.key;
                      return (
                        <div
                          key={step.key}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                            active
                              ? "border-accent-line bg-accent-soft text-ink"
                              : complete
                                ? "border-line bg-bg-sub text-ink"
                                : "border-line bg-surface text-mute"
                          }`}
                        >
                          <div className="flex size-7 items-center justify-center rounded-full border border-line bg-surface">
                            {complete ? <Check size={13} className="text-good" /> : <Icon size={13} />}
                          </div>
                          <span className="mono text-2xs uppercase tracking-mono">{step.label}</span>
                          {active && <CircleDot size={12} className="ml-auto animate-pulse text-accent" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-line bg-bg-sub p-3">
                    <div className="mono text-2xs uppercase tracking-mono text-mute-2">packet queue</div>
                    <div className="mt-2 space-y-2">
                      {selectedRoles.slice(0, 4).map((role, index) => (
                        <PacketRow key={role.id} role={role} index={index} status={status} />
                      ))}
                    </div>
                    <div className="mt-3 border-t border-line pt-3">
                      <div className="mono text-2xs uppercase tracking-mono text-mute-2">human boundary</div>
                      <p className="mt-1 text-xs leading-relaxed text-mute">
                        Agents prepare role-specific packets for the demo. Nothing is submitted until the user reviews and sends.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {status === "queued" ? (
                      <>
                        <Link
                          href={"/dashboard/applications" as Route}
                          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                        >
                          Review {selectedCount} queued packets <ArrowRight size={14} />
                        </Link>
                        <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={resetDemo}>
                          Reset demo flow
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="lg"
                        className="w-full rounded-lg"
                        disabled={selectedCount === 0 || busy}
                        onClick={queueAgents}
                      >
                        {busy ? `Preparing packets · ${progress}%` : `Queue ${selectedCount} agent applications`}
                        <Sparkles size={14} />
                      </Button>
                    )}
                    <div className="mono text-center text-2xs text-mute-2">
                      demo only · mock data · no job submission
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}

function PacketRow({ role, index, status }: { role: DemoRole; index: number; status: AgentStatus }) {
  const rank = statusRank(status);
  const visibleRank = Math.max(0, rank - (index % 2));
  const state =
    status === "queued"
      ? "queued"
      : visibleRank >= 4
        ? "final check"
        : visibleRank >= 3
          ? "drafting"
          : visibleRank >= 2
            ? "tailoring"
            : visibleRank >= 1
              ? "matching"
              : "waiting";
  const done = status === "queued" || visibleRank >= 4;
  const active = status !== "idle" && !done && state !== "waiting";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2">
      <div
        className={`flex size-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold ${
          done ? "border-accent-line bg-accent-soft text-accent" : "border-line bg-bg-sub text-mute"
        }`}
      >
        {done ? <Check size={11} /> : role.logo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium text-ink">{role.company}</div>
        <div className="mono truncate text-3xs uppercase tracking-mono text-mute-2">{state}</div>
      </div>
      {active && <CircleDot size={11} className="animate-pulse text-accent" />}
    </div>
  );
}

function ContextChip({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-bg-sub/80 px-3 py-1.5">
      <Icon size={13} className="text-accent" />
      <span className="mono text-2xs text-mute-2">{label}</span>
      <span className="max-w-[220px] truncate text-xs font-medium text-ink">{value}</span>
    </div>
  );
}

function Metric({ label, value, detail, tone = "text-ink" }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mono text-2xs uppercase tracking-mono text-mute-2">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tighter ${tone}`}>{value}</div>
      <div className="mt-1 text-xs text-mute">{detail}</div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-line-2 bg-surface px-2 py-1 text-[11px] text-ink">{children}</span>;
}

function RoleCard({ role, rank, busy, onToggle }: { role: DemoRole; rank: number; busy: boolean; onToggle: () => void }) {
  return (
    <article
      className={`group rounded-2xl border bg-surface p-4 transition-all ${
        role.selected ? "border-accent-line shadow-sm" : "border-line hover:border-line-2"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <button
          type="button"
          disabled={busy}
          onClick={onToggle}
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            role.selected
              ? "border-accent-line bg-accent-soft text-accent"
              : "border-line bg-bg-sub text-mute hover:text-ink"
          }`}
          aria-label={role.selected ? `Remove ${role.title} from agent queue` : `Add ${role.title} to agent queue`}
        >
          {role.selected ? <Check size={15} /> : rank.toString().padStart(2, "0")}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md border border-line bg-bg-sub text-xs font-semibold text-ink">
                  {role.logo}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink">{role.title}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mute">
                    <span>{role.company}</span>
                    <span className="text-mute-3">·</span>
                    <span>{role.location}</span>
                    <span className="text-mute-3">·</span>
                    <span>{role.salary}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-mute">{role.reason}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Score label="fit" value={role.fit} />
              <Score label="path" value={role.strategic} accent />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-xl border border-line bg-bg-sub p-3">
              <div className="mono mb-2 text-2xs uppercase tracking-mono text-mute-2">why this made the cut</div>
              <div className="flex flex-wrap gap-1.5">
                {role.evidence.map((item) => (
                  <span key={item} className="rounded-full border border-line-2 bg-surface px-2 py-1 text-[11px] text-mute">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mute-2">{role.agentNote}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              <Signal icon={BriefcaseBusiness} label="mode" value={role.workMode} />
              <Signal icon={Gauge} label="connection" value={`${role.connection}%`} />
              <Signal icon={Clock3} label="move" value={role.velocity} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Score({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="min-w-18 rounded-lg border border-line bg-bg-sub px-3 py-2 text-right">
      <div className="mono text-2xs uppercase tracking-mono text-mute-2">{label}</div>
      <div className={`mt-1 text-lg font-semibold leading-none ${accent ? "text-accent" : scoreTone(value)}`}>{value}</div>
    </div>
  );
}

function Signal({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <div className="flex items-center gap-1.5 text-mute-2">
        <Icon size={11} />
        <span className="mono text-3xs uppercase tracking-mono">{label}</span>
      </div>
      <div className="mt-1 truncate text-xs font-medium text-ink">{value}</div>
    </div>
  );
}
