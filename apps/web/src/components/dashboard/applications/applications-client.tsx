"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import type { JobApplication, JobApplicationStage, JobApplicationStatus } from "@kursa/types";
import { api } from "@/lib/api";
import { STAGE_ORDER, STAGE_LABEL, STAGE_IDX } from "./constants";
import { stageChipClass, formatDate } from "./utils";
import { ApplicationForm } from "./application-form";

interface Props {
  initialApplications: JobApplication[];
}

export default function ApplicationsClient({ initialApplications }: Props) {
  const [apps, setApps] = useState<JobApplication[]>(initialApplications);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const activeCount = apps.filter((a) => a.status === "active").length;
  const closedCount = apps.filter((a) => a.status !== "active").length;

  async function handleCreate(data: any) {
    setSaving(true);
    try {
      const { application } = await api.applications.create(data);
      setApps((prev) => [application, ...prev]);
      setAdding(false);
      toast.success("Application added");
    } catch {
      toast.error("Failed to add application");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, data: any) {
    setSaving(true);
    try {
      const { application } = await api.applications.update(id, data);
      setApps((prev) => prev.map((a) => (a.id === id ? application : a)));
      setEditId(null);
      toast.success("Application updated");
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
    } catch {
      toast.error("Failed to update stage");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-sm font-medium text-ink">
            Applications
          </h1>
          <p className="mono text-2xs mt-0.5 text-mute-2">
            {activeCount} active · {closedCount} closed
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="mono flex items-center gap-1.5 text-[11px] px-3 py-[5px] rounded-[6px] border border-line-2 bg-bg-sub-2 text-ink hover:bg-line-3 cursor-pointer transition-colors duration-150"
          >
            <Plus size={12} />
            Add application
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-6 p-4 rounded-lg border border-line-2 bg-bg-sub">
          <p className="mono text-2xs mb-3 text-mute-2">
            new application
          </p>
          <ApplicationForm
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Empty state */}
      {apps.length === 0 && !adding && (
        <div className="py-16 text-center">
          <p className="text-xs text-mute-3">
            No applications yet. Add a role to start tracking.
          </p>
        </div>
      )}

      {/* Application list */}
      {apps.length > 0 && (
        <div className="flex flex-col gap-2">
          {apps.map((app) =>
            editId === app.id ? (
              <div
                key={app.id}
                className="p-4 rounded-lg border border-accent-line bg-bg-sub"
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
              <div
                key={app.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-line bg-bg-sub group hover:border-line-2 transition-colors duration-150"
              >
                {/* Company initial */}
                <div className="flex items-center justify-center rounded-md flex-shrink-0 w-8 h-8 bg-bg-sub-2 border border-line-2 text-xs font-semibold mono text-mute">
                  {app.company[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-ink">
                      {app.roleTitle}
                    </span>
                    <span className="text-xs text-mute-2">
                      @ {app.company}
                    </span>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mute-3 hover:text-ink transition-colors duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {/* Stage selector inline */}
                    <div className="relative">
                      <select
                        value={app.stage}
                        onChange={(e) => handleStageChange(app, e.target.value as JobApplicationStage)}
                        className={`${stageChipClass(app.stage as JobApplicationStage)} appearance-none cursor-pointer bg-transparent border-none p-0 focus:outline-none`}
                      >
                        {STAGE_ORDER.map((s) => (
                          <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                    {app.appliedAt && (
                      <span className="mono text-2xs text-mute-3">
                        applied {formatDate(app.appliedAt)}
                      </span>
                    )}
                    {app.nextAction && (
                      <span className="mono text-2xs text-mute-2">
                        next: {app.nextAction}
                        {app.nextActionAt ? ` · ${formatDate(app.nextActionAt)}` : ""}
                      </span>
                    )}
                  </div>
                  {app.notes && (
                    <p className="text-2xs mt-1.5 leading-relaxed text-mute-2">
                      {app.notes}
                    </p>
                  )}
                </div>

                {/* Stage progress dots */}
                <div className="flex items-center gap-0.5 flex-shrink-0 mt-1">
                  {STAGE_ORDER.filter((s) => s !== "closed").map((s, i) => (
                    <div
                      key={s}
                      title={STAGE_LABEL[s]}
                      className={`w-[5px] h-[5px] rounded-full transition-colors duration-150 ${
                        i <= STAGE_IDX[app.stage as JobApplicationStage]
                          ? "bg-accent"
                          : "bg-line-2"
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditId(app.id)}
                    className="mono text-2xs px-2 py-0.5 rounded border border-line-2 bg-bg-sub-2 text-mute hover:text-ink hover:bg-line-3 cursor-pointer transition-colors duration-150"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deleting === app.id}
                    className="bg-transparent border-none text-mute-3 hover:text-destructive cursor-pointer p-1 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
