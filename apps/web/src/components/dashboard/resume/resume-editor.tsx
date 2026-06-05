"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type {
  AchievementType,
  ResumeAchievement,
  ResumeCertification,
  ResumeContent,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  ResumeSectionKey,
} from "@kursa/types";
import {
  MAX_ACHIEVEMENTS,
  MAX_BULLETS,
  MAX_CERTIFICATIONS,
  MAX_EDUCATION,
  MAX_PROJECTS,
  MAX_ROLES,
  MAX_SKILLS,
} from "@kursa/types";

import {
  ACHIEVEMENT_TYPE_LABELS,
  normalizeResumeSectionOrder,
  RESUME_SECTION_LABELS,
} from "@/lib/dashboard/resume/section-order";
import {
  estimatePageWeight,
  PAGE_FIT_WARNING_THRESHOLD,
} from "@/lib/dashboard/resume/page-weight";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

interface ResumeEditorProps {
  value: ResumeContent;
  onChange: (next: ResumeContent) => void;
  changedPaths?: string[];
}


const ACHIEVEMENT_TYPES = Object.keys(ACHIEVEMENT_TYPE_LABELS) as AchievementType[];

const inputCls =
  "w-full bg-bg border border-line rounded-sm px-2 py-1 text-xs text-ink focus:outline-none focus:border-line-2";
const labelCls = "mono text-2xs text-mute-2 uppercase tracking-mono mb-1 block";
const sectionBtnCls =
  "mono text-2xs text-mute flex items-center gap-1 self-start hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed";
const removeBtnCls = "text-mute-3 hover:text-warn";
const reorderBtnCls =
  "text-mute-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed";

const emptyExperience: ResumeExperience = {
  roleTitle: "",
  company: "",
  period: "",
  bullets: [""],
};
const emptyProject: ResumeProject = { title: "", description: "", period: "", url: "", bullets: [] };
const emptyEducation: ResumeEducation = { credential: "", issuer: "", year: "" };
const emptyCertification: ResumeCertification = { name: "", issuer: "", year: "" };
const emptyAchievement: ResumeAchievement = { type: "HACKATHON", title: "", issuer: "", url: "", year: "" };

function Field({ label, children, changed = false }: { label: string; children: React.ReactNode; changed?: boolean }) {
  return (
    <div className={changed ? "rounded-md ring-1 ring-warn/60 bg-warn/5 p-2 -m-2" : undefined}>
      <span className={labelCls}>{label}</span>
      {children}
    </div>
  );
}

function SectionHeader({
  label,
  count,
  max,
  onAdd,
  addLabel,
}: {
  label: string;
  count: number;
  max: number;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={labelCls}>{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={onAdd}
        disabled={count >= max}
        className={`${sectionBtnCls} mb-1`}
        aria-label={addLabel}
      >
        <Plus size={11} /> {addLabel} ({count}/{max})
      </Button>
    </div>
  );
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const item = next.splice(from, 1)[0] as T;
  next.splice(to, 0, item);
  return next;
}

function ReorderControls({
  index,
  count,
  label,
  onMove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (nextIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 mt-0.5" aria-label={`${label} reorder controls`}>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onMove(index - 1)}
        disabled={index === 0}
        className={reorderBtnCls}
        aria-label={`Move ${label} up`}
      >
        <ChevronUp size={13} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onMove(index + 1)}
        disabled={index === count - 1}
        className={reorderBtnCls}
        aria-label={`Move ${label} down`}
      >
        <ChevronDown size={13} />
      </Button>
    </div>
  );
}


export default function ResumeEditor({ value, onChange, changedPaths = [] }: ResumeEditorProps) {
  const projects = value.projects ?? [];
  const achievements = value.achievements ?? [];
  const sectionOrder = normalizeResumeSectionOrder(value);
  const likelyOverOnePage = estimatePageWeight(value) > PAGE_FIT_WARNING_THRESHOLD;

  function isChanged(path: string): boolean {
    return changedPaths.some((changedPath) => changedPath === path || changedPath.startsWith(`${path}.`));
  }

  function isSectionChanged(section: ResumeSectionKey): boolean {
    const root = section === "others" ? "achievements" : section;
    return isChanged(root) || isChanged("sectionOrder");
  }

  function changedCardCls(path: string): string {
    return isChanged(path) ? " ring-1 ring-warn/60 bg-warn/5" : "";
  }

  function patch(p: Partial<ResumeContent>) {
    onChange({ ...value, ...p });
  }


  function setExperience(i: number, next: ResumeExperience) {
    patch({ experience: value.experience.map((e, idx) => (idx === i ? next : e)) });
  }

  function setProject(i: number, next: ResumeProject) {
    patch({ projects: projects.map((p, idx) => (idx === i ? next : p)) });
  }

  function setEducation(i: number, next: ResumeEducation) {
    patch({ education: value.education.map((e, idx) => (idx === i ? next : e)) });
  }

  function setCertification(i: number, next: ResumeCertification) {
    patch({ certifications: value.certifications.map((c, idx) => (idx === i ? next : c)) });
  }

  function setAchievement(i: number, next: ResumeAchievement) {
    patch({ achievements: achievements.map((a, idx) => (idx === i ? next : a)) });
  }

  function sectionHasContent(section: ResumeSectionKey): boolean {
    switch (section) {
      case "summary":
        return value.summary.trim().length > 0;
      case "experience":
        return value.experience.length > 0;
      case "skills":
        return value.skills.length > 0;
      case "education":
        return value.education.length > 0;
      case "certifications":
        return value.certifications.length > 0;
      case "projects":
        return projects.length > 0;
      case "others":
        return achievements.length > 0;
    }
  }

  function SectionShell({ section, children }: { section: ResumeSectionKey; children: React.ReactNode }) {
    const index = sectionOrder.indexOf(section);
    return (
      <div className={`rounded-lg border border-line bg-bg-sub p-3 flex flex-col gap-3${isSectionChanged(section) ? " ring-1 ring-warn/60" : ""}`}>
        <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <ReorderControls
              index={index}
              count={sectionOrder.length}
              label={`${RESUME_SECTION_LABELS[section]} section`}
              onMove={(nextIndex) => patch({ sectionOrder: moveItem(sectionOrder, index, nextIndex) })}
            />
            <div>
              <div className="mono text-2xs text-mute-2 uppercase tracking-mono">
                {RESUME_SECTION_LABELS[section]} section
              </div>
              {!sectionHasContent(section) && (
                <div className="mono text-2xs text-mute-3">empty sections stay hidden in preview/PDF</div>
              )}
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  const sections: Record<ResumeSectionKey, React.ReactNode> = {
    summary: (
      <Field label="Summary" changed={isChanged("summary")}>
        <textarea
          className={`${inputCls} min-h-16 resize-y`}
          value={value.summary}
          onChange={(e) => patch({ summary: e.target.value })}
        />
      </Field>
    ),
    experience: (
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Experience"
          count={value.experience.length}
          max={MAX_ROLES}
          addLabel="add experience"
          onAdd={() => patch({ experience: [...value.experience, { ...emptyExperience }] })}
        />
        {value.experience.map((exp, i) => (
          <div key={i} className={`rounded-md border border-line p-3 flex flex-col gap-2 bg-bg-sub-2${changedCardCls(`experience.${i}`)}`}>
            <div className="flex items-start justify-between gap-2">
              <ReorderControls
                index={i}
                count={value.experience.length}
                label="experience"
                onMove={(nextIndex) => patch({ experience: moveItem(value.experience, i, nextIndex) })}
              />
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  className={inputCls}
                  placeholder="Role title"
                  value={exp.roleTitle}
                  onChange={(e) => setExperience(i, { ...exp, roleTitle: e.target.value })}
                />
                <Input
                  className={inputCls}
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => setExperience(i, { ...exp, company: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => patch({ experience: value.experience.filter((_, idx) => idx !== i) })}
                className={`${removeBtnCls} mt-1`}
                aria-label="Remove experience"
              >
                <X size={13} />
              </Button>
            </div>
            <Input
              className={inputCls}
              placeholder="Period (e.g. 2024 – present)"
              value={exp.period}
              onChange={(e) => setExperience(i, { ...exp, period: e.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              {exp.bullets.map((b, j) => (
                <div key={j} className="flex items-start gap-1.5">
                  <ReorderControls
                    index={j}
                    count={exp.bullets.length}
                    label="bullet"
                    onMove={(nextIndex) =>
                      setExperience(i, { ...exp, bullets: moveItem(exp.bullets, j, nextIndex) })
                    }
                  />
                  <textarea
                    className={`${inputCls} min-h-12 resize-y`}
                    value={b}
                    onChange={(e) => {
                      const bullets = exp.bullets.map((x, k) => (k === j ? e.target.value : x));
                      setExperience(i, { ...exp, bullets });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      setExperience(i, { ...exp, bullets: exp.bullets.filter((_, k) => k !== j) })
                    }
                    className={`${removeBtnCls} mt-1`}
                    aria-label="Remove bullet"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ))}
              {exp.bullets.length < MAX_BULLETS && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setExperience(i, { ...exp, bullets: [...exp.bullets, ""] })}
                  className={sectionBtnCls}
                >
                  <Plus size={11} /> add bullet ({exp.bullets.length}/{MAX_BULLETS})
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    ),
    skills: (
      <Field label={`Skills (comma-separated, max ${MAX_SKILLS})`} changed={isChanged("skills")}>
        <textarea
          className={`${inputCls} min-h-12 resize-y`}
          value={value.skills.join(", ")}
          onChange={(e) =>
            patch({
              skills: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, MAX_SKILLS),
            })
          }
        />
        {value.skills.length > 1 && (
          <div className="mt-2 flex flex-col gap-1">
            {value.skills.map((skill, i) => (
              <div
                key={`${skill}-${i}`}
                className="flex items-center gap-2 rounded-sm border border-line bg-bg-sub-2 px-2 py-1"
              >
                <ReorderControls
                  index={i}
                  count={value.skills.length}
                  label="skill"
                  onMove={(nextIndex) => patch({ skills: moveItem(value.skills, i, nextIndex) })}
                />
                <span className="text-xs text-ink flex-1">{skill}</span>
              </div>
            ))}
          </div>
        )}
      </Field>
    ),
    projects: (
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Projects"
          count={projects.length}
          max={MAX_PROJECTS}
          addLabel="add project"
          onAdd={() => patch({ projects: [...projects, { ...emptyProject }] })}
        />
        {projects.map((project, i) => (
          <div key={i} className={`rounded-md border border-line p-3 flex flex-col gap-2 bg-bg-sub-2${changedCardCls(`projects.${i}`)}`}>
            <div className="flex items-start gap-2">
              <ReorderControls
                index={i}
                count={projects.length}
                label="project"
                onMove={(nextIndex) => patch({ projects: moveItem(projects, i, nextIndex) })}
              />
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  className={inputCls}
                  placeholder="Project title"
                  value={project.title}
                  onChange={(e) => setProject(i, { ...project, title: e.target.value })}
                />
                <Input
                  className={inputCls}
                  placeholder="Period, e.g. 2024 – Present"
                  value={project.period ?? ""}
                  onChange={(e) => setProject(i, { ...project, period: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => patch({ projects: projects.filter((_, idx) => idx !== i) })}
                className={`${removeBtnCls} mt-1`}
                aria-label="Remove project"
              >
                <X size={13} />
              </Button>
            </div>
            <Input
              className={inputCls}
              placeholder="Project URL"
              value={project.url ?? ""}
              onChange={(e) => setProject(i, { ...project, url: e.target.value })}
            />
            <textarea
              className={`${inputCls} min-h-12 resize-y`}
              placeholder="Short description"
              value={project.description}
              onChange={(e) => setProject(i, { ...project, description: e.target.value })}
            />
            <textarea
              className={`${inputCls} min-h-16 resize-y`}
              placeholder="Project bullets (one per line)"
              value={(project.bullets ?? []).join("\n")}
              onChange={(e) =>
                setProject(i, {
                  ...project,
                  bullets: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .slice(0, 3),
                })
              }
            />
          </div>
        ))}
      </div>
    ),
    others: (
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Others"
          count={achievements.length}
          max={MAX_ACHIEVEMENTS}
          addLabel="add achievement"
          onAdd={() => patch({ achievements: [...achievements, { ...emptyAchievement }] })}
        />
        {achievements.map((achievement, i) => (
          <div key={i} className={`rounded-md border border-line p-3 flex flex-col gap-2 bg-bg-sub-2${changedCardCls(`achievements.${i}`)}`}>
            <div className="flex items-start gap-2">
              <ReorderControls
                index={i}
                count={achievements.length}
                label="achievement"
                onMove={(nextIndex) => patch({ achievements: moveItem(achievements, i, nextIndex) })}
              />
              <div className="grid grid-cols-2 gap-2 flex-1">
                <select
                  className={inputCls}
                  value={achievement.type}
                  onChange={(e) =>
                    setAchievement(i, { ...achievement, type: e.target.value as AchievementType })
                  }
                  aria-label="Achievement type"
                >
                  {ACHIEVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ACHIEVEMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <Input
                  className={inputCls}
                  placeholder="Title"
                  value={achievement.title}
                  onChange={(e) => setAchievement(i, { ...achievement, title: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => patch({ achievements: achievements.filter((_, idx) => idx !== i) })}
                className={`${removeBtnCls} mt-1`}
                aria-label="Remove achievement"
              >
                <X size={13} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                className={inputCls}
                placeholder="Issuer (optional)"
                value={achievement.issuer ?? ""}
                onChange={(e) => setAchievement(i, { ...achievement, issuer: e.target.value || undefined })}
              />
              <Input
                className={inputCls}
                placeholder="Year (optional)"
                value={achievement.year ?? ""}
                onChange={(e) => setAchievement(i, { ...achievement, year: e.target.value || undefined })}
              />
            </div>
            <Input
              className={inputCls}
              placeholder="URL (optional)"
              value={achievement.url ?? ""}
              onChange={(e) => setAchievement(i, { ...achievement, url: e.target.value || undefined })}
            />
          </div>
        ))}
      </div>
    ),
    education: (
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Education"
          count={value.education.length}
          max={MAX_EDUCATION}
          addLabel="add education"
          onAdd={() => patch({ education: [...value.education, { ...emptyEducation }] })}
        />
        {value.education.map((education, i) => (
          <div key={i} className={`rounded-md border border-line p-3 flex flex-col gap-2 bg-bg-sub-2${changedCardCls(`education.${i}`)}`}>
            <div className="flex items-start gap-2">
              <ReorderControls
                index={i}
                count={value.education.length}
                label="education"
                onMove={(nextIndex) => patch({ education: moveItem(value.education, i, nextIndex) })}
              />
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  className={inputCls}
                  placeholder="Credential"
                  value={education.credential}
                  onChange={(e) => setEducation(i, { ...education, credential: e.target.value })}
                />
                <Input
                  className={inputCls}
                  placeholder="Issuer"
                  value={education.issuer}
                  onChange={(e) => setEducation(i, { ...education, issuer: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => patch({ education: value.education.filter((_, idx) => idx !== i) })}
                className={`${removeBtnCls} mt-1`}
                aria-label="Remove education"
              >
                <X size={13} />
              </Button>
            </div>
            <Input
              className={inputCls}
              placeholder="Year"
              value={education.year ?? ""}
              onChange={(e) => setEducation(i, { ...education, year: e.target.value || undefined })}
            />
          </div>
        ))}
      </div>
    ),
    certifications: (
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Certifications"
          count={value.certifications.length}
          max={MAX_CERTIFICATIONS}
          addLabel="add certification"
          onAdd={() => patch({ certifications: [...value.certifications, { ...emptyCertification }] })}
        />
        {value.certifications.map((certification, i) => (
          <div key={i} className={`rounded-md border border-line p-3 flex flex-col gap-2 bg-bg-sub-2${changedCardCls(`certifications.${i}`)}`}>
            <div className="flex items-start gap-2">
              <ReorderControls
                index={i}
                count={value.certifications.length}
                label="certification"
                onMove={(nextIndex) =>
                  patch({ certifications: moveItem(value.certifications, i, nextIndex) })
                }
              />
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  className={inputCls}
                  placeholder="Certification"
                  value={certification.name}
                  onChange={(e) => setCertification(i, { ...certification, name: e.target.value })}
                />
                <Input
                  className={inputCls}
                  placeholder="Issuer"
                  value={certification.issuer}
                  onChange={(e) => setCertification(i, { ...certification, issuer: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() =>
                  patch({ certifications: value.certifications.filter((_, idx) => idx !== i) })
                }
                className={`${removeBtnCls} mt-1`}
                aria-label="Remove certification"
              >
                <X size={13} />
              </Button>
            </div>
            <Input
              className={inputCls}
              placeholder="Year"
              value={certification.year ?? ""}
              onChange={(e) =>
                setCertification(i, { ...certification, year: e.target.value || undefined })
              }
            />
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
      {likelyOverOnePage && (
        <div className="rounded-md border border-line bg-bg-sub-2 px-3 py-2 mono text-2xs text-warn leading-relaxed">
          This résumé is likely to spill beyond one page. Compact styling will help, but consider
          shortening bullets or removing lower-priority resume-only items before downloading.
        </div>
      )}

      <Field label="Full name" changed={isChanged("fullName")}>
        <Input
          className={inputCls}
          value={value.fullName}
          onChange={(e) => patch({ fullName: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" changed={isChanged("contact.email")}>
          <Input
            className={inputCls}
            value={value.contact.email ?? ""}
            onChange={(e) =>
              patch({ contact: { ...value.contact, email: e.target.value || undefined } })
            }
          />
        </Field>
        <Field label="Location" changed={isChanged("contact.location")}>
          <Input
            className={inputCls}
            value={value.contact.location ?? ""}
            onChange={(e) =>
              patch({ contact: { ...value.contact, location: e.target.value || undefined } })
            }
          />
        </Field>
      </div>

      <Field label="Links (comma-separated)" changed={isChanged("contact.links")}>
        <Input
          className={inputCls}
          value={value.contact.links.join(", ")}
          onChange={(e) =>
            patch({
              contact: {
                ...value.contact,
                links: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />
      </Field>

      {sectionOrder.map((section) => (
        <SectionShell key={section} section={section}>
          {sections[section]}
        </SectionShell>
      ))}
    </div>
  );
}
