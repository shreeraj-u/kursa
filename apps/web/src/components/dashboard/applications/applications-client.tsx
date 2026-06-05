"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Briefcase, ListFilter } from "lucide-react";
import type {
  ApplicationCreateInput,
  JobApplication,
  JobApplicationStage,
  JobApplicationStatus,
} from "@kursa/types";
import { api } from "@/lib/api";
import { STAGE_ORDER, STAGE_LABEL, STAGE_IDX } from "./constants";
import { stageChipClass, formatDate } from "./utils";
import PageHeader from "@/components/dashboard/page-header";
import PageHelpButton from "@/components/dashboard/page-help-button";
import { DASHBOARD_PAGE_HELP } from "@/components/dashboard/page-help";

import { ApplicationForm } from "./application-form";

type StatusFilter = "all" | "active" | "closed";

const APPLICATION_FLOW = [
  "shortlist → target",
  "stage → track",
  "next action → follow up",
  "outcome → learn",
] as const;

const RELATED_LINKS = [
  { href: "/dashboard/shortlist" as Route, label: "Shortlist", Icon: ListFilter },
  { href: "/dashboard" as Route, label: "Home", Icon: Briefcase },
] as const;

interface Props {
  initialApplications: JobApplication[];
}

export default function ApplicationsClient({ initialApplications }: Props) {
  const [apps, setApps] = useState<JobApplication[]>(initialApplications);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const activeCount = apps.filter((a) => a.status === "active").length;
  const closedCount = apps.filter((a) => a.status !== "active").length;
  const withNextAction = apps.filter((a) => a.nextAction && a.status === "active").length;
  const offerCount = apps.filter((a) => a.stage === "offer" && a.status === "active").length;

  const filteredApps = useMemo(() => {
    const list =
      statusFilter === "active"
        ? apps.filter((a) => a.status === "active")
        : statusFilter === "closed"
          ? apps.filter((a) => a.status !== "active")
          : apps;
    return [...list].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime();
    });
  }, [apps, statusFilter]);

  const stageBreakdown = useMemo(() => {
    const active = apps.filter((a) => a.status === "active");
    return STAGE_ORDER.filter((s) => s !== "closed").map((stage) => ({
      stage,
      count: active.filter((a) => a.stage === stage).length,
    }));
  }, [apps]);

  async function handleCreate(data: ApplicationCreateInput) {
    setSaving(true);
    try {
      const { application } = await api.applications.create(data);
      setApps((prev) => [application, ...prev]);
      setAdding(false);
      toast.success("Application added — dashboard activity refreshed.");
    } catch {
      toast.error("Failed to add application");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, data: ApplicationCreateInput) {
    setSaving(true);
    try {
      const { application } = await api.applications.update(id, data);
      setApps((prev) => prev.map((a) => (a.id === id ? application : a)));
      setEditId(null);
      const existing = apps.find((a) => a.id === id);
      const activityChanged =
        (data.stage !== undefined && data.stage !== existing?.stage) ||
        (data.status !== undefined && data.status !== existing?.status);
      toast.success(activityChanged ? "Application updated — dashboard activity refreshed." : "Application updated");
    } catch {
      toast.error("Failed to update application");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await api.applications.delete(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
      toast.success("Application removed");
    } catch {
      toast.error("Failed to remove application");
    } finally {
      setDeleting(null);
    }
  }

  async function handleStageChange(app: JobApplication, stage: JobApplicationStage) {
    try {
      const { application } = await api.applications.update(app.id, { stage });
      setApps((prev) => prev.map((a) => (a.id === app.id ? application : a)));
      toast.success("Stage updated — dashboard activity refreshed.");
    } catch {
      toast.error("Failed to update stage");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Applications" />

      <div className="flex flex-col gap-5 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tighter text-ink">Applications</h1>
              <PageHelpButton help={DASHBOARD_PAGE_HELP.applications} label="Applications" />
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mute">
              Track roles from interest through offer. Stage movement, next actions, and outcomes feed Home&apos;s in-flight view and sharpen future guidance.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {APPLICATION_FLOW.map((item) => (
                <span key={item} className="mono rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] text-mute">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {RELATED_LINKS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="mono inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] text-mute transition-colors hover:border-line-2 hover:text-ink-2"
                >
                  <Icon size={11} />
                  {label}
                </Link>
              ))}
            </div>
            <Link
              href={"/dashboard/docs" as Route}
              className="mono mt-2 inline-block text-2xs text-mute-2 underline"
            >
              How does this work?
            </Link>
          </div>

          <div className="flex flex-wrap items-stretch gap-2 self-start">
            <StatCard value={activeCount} label="active" />
            <StatCard value={withNextAction} label="next actions" />
            <StatCard value={offerCount} label="offers" tone={offerCount > 0 ? "var(--accent)" : undefined} />
            {closedCount > 0 && <StatCard value={closedCount} label="closed" />}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="mono text-2xs text-mute-2">tracker</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "active", "closed"] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setStatusFilter(id)}
                        className="mono rounded px-2 py-1 capitalize"
                        style={{
                          fontSize: 9,
                          border: "1px solid",
                          borderColor: statusFilter === id ? "var(--accent-line)" : "var(--line)",
                          background: statusFilter === id ? "var(--accent-soft)" : "transparent",
                          color: statusFilter === id ? "var(--accent)" : "var(--mute)",
                          cursor: "pointer",
                        }}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
                {!adding && (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mono flex shrink-0 items-center gap-1.5 rounded-md border border-line-2 bg-bg-sub-2 px-3 py-[5px] text-[11px] text-ink transition-colors duration-150 hover:bg-line-3"
                  >
                    <Plus size={12} />
                    Add application
                  </button>
                )}
              </div>

              <div className="p-4">
                {adding && (
                  <div className="mb-4 rounded-lg border border-line-2 bg-bg-sub p-4">
                    <p className="mono mb-3 text-2xs text-mute-2">new application</p>
                    <ApplicationForm
                      onSave={handleCreate}
                      onCancel={() => setAdding(false)}
                      saving={saving}
                    />
                  </div>
                )}

                {filteredApps.length === 0 && !adding ? (
                  <div className="rounded-xl border border-line bg-bg-sub px-6 py-12 text-center">
                    <p className="text-sm font-medium text-ink">
                      {statusFilter === "active"
                        ? "No active applications"
                        : statusFilter === "closed"
                          ? "No closed applications"
                          : "No applications yet"}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-mute">
                      {statusFilter === "all"
                        ? "Add a role when it becomes real. Kursa uses stage movement and outcomes to make future guidance sharper."
                        : "Try a different filter or add a new application."}
                    </p>
                    {statusFilter === "all" && (
                      <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="mono mt-4 inline-flex items-center gap-1.5 rounded-md border border-line-2 bg-surface px-3 py-1.5 text-[11px] text-ink transition-colors hover:bg-bg-sub"
                      >
                        <Plus size={12} />
                        Add application
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredApps.map((app) =>
                      editId === app.id ? (
                        <div
                          key={app.id}
                          className="rounded-lg border border-accent-line bg-bg-sub p-4"
                        >
                          <ApplicationForm
                            initial={{
                              company: app.company,
                              roleTitle: app.roleTitle,
                              stage: app.stage as JobApplicationStage,
                              status: app.status as JobApplicationStatus,
                              url: app.url ?? null,
                              notes: app.notes ?? null,
                              appliedAt: app.appliedAt ?? null,
                              nextAction: app.nextAction ?? null,
                              nextActionAt: app.nextActionAt ?? null,
                            }}
                            onSave={(data) => handleUpdate(app.id, data)}
                            onCancel={() => setEditId(null)}
                            saving={saving}
                          />
                        </div>
                      ) : (
                        <ApplicationRow
                          key={app.id}
                          app={app}
                          deleting={deleting === app.id}
                          onEdit={() => setEditId(app.id)}
                          onDelete={() => void handleDelete(app.id)}
                          onStageChange={(stage) => void handleStageChange(app, stage)}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-line bg-surface p-4">
              <div className="mono mb-3 text-2xs text-mute-2">pipeline</div>
              {activeCount === 0 ? (
                <p className="text-xs leading-relaxed text-mute-3">
                  Active roles will appear here by stage so you can see where momentum is building.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {stageBreakdown.map(({ stage, count }) =>
                    count > 0 ? (
                      <div key={stage} className="flex items-center justify-between gap-2">
                        <span className={stageChipClass(stage)}>{STAGE_LABEL[stage]}</span>
                        <span className="mono text-2xs text-mute-2">{count}</span>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-line bg-surface p-4">
              <div className="mono mb-3 text-2xs text-mute-2">on home</div>
              <p className="text-xs leading-relaxed text-mute">
                Active applications surface in the in-flight card on Home. Keep stages current so dashboard signals stay accurate.
              </p>
              <Link
                href="/dashboard"
                className="mono mt-3 inline-block text-2xs text-accent hover:underline"
              >
                view on home →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-center">
      <div className="text-lg font-semibold leading-none text-ink" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      <div className="mono mt-1 text-2xs text-mute-2">{label}</div>
    </div>
  );
}

function ApplicationRow({
  app,
  deleting,
  onEdit,
  onDelete,
  onStageChange,
}: {
  app: JobApplication;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStageChange: (stage: JobApplicationStage) => void;
}) {
  const inactive = app.status !== "active";

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border p-3 transition-colors duration-150 ${
        inactive ? "border-line bg-bg-sub/60 opacity-80" : "border-line bg-bg-sub hover:border-line-2"
      }`}
    >
      <div className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line-2 bg-bg-sub-2 text-xs font-semibold text-mute">
        {app.company[0].toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink">{app.roleTitle}</span>
          <span className="text-xs text-mute-2">@ {app.company}</span>
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mute-3 transition-colors duration-150 hover:text-ink"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <select
            value={app.stage}
            onChange={(e) => onStageChange(e.target.value as JobApplicationStage)}
            disabled={inactive}
            className={`${stageChipClass(app.stage as JobApplicationStage)} cursor-pointer appearance-none border-none bg-transparent p-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
          {app.appliedAt && (
            <span className="mono text-2xs text-mute-3">applied {formatDate(app.appliedAt)}</span>
          )}
          {app.nextAction && (
            <span className="mono text-2xs text-mute-2">
              next: {app.nextAction}
              {app.nextActionAt ? ` · ${formatDate(app.nextActionAt)}` : ""}
            </span>
          )}
        </div>
        {app.notes && (
          <p className="mt-1.5 text-2xs leading-relaxed text-mute-2">{app.notes}</p>
        )}
      </div>

      <div className="mt-1 flex shrink-0 items-center gap-0.5">
        {STAGE_ORDER.filter((s) => s !== "closed").map((s, i) => (
          <div
            key={s}
            title={STAGE_LABEL[s]}
            className={`h-[5px] w-[5px] rounded-full transition-colors duration-150 ${
              i <= STAGE_IDX[app.stage as JobApplicationStage] ? "bg-accent" : "bg-line-2"
            }`}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="mono cursor-pointer rounded border border-line-2 bg-bg-sub-2 px-2 py-0.5 text-2xs text-mute transition-colors duration-150 hover:bg-line-3 hover:text-ink"
        >
          edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="cursor-pointer border-none bg-transparent p-1 text-mute-3 transition-colors duration-150 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
