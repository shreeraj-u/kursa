"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const SECTIONS = [
  {
    id: "home",
    title: "Home",
    body: `Your dashboard at a glance. Career pulse tracks growth, visibility, and progression signals from your profile and activity. Aria noticed surfaces observations generated from your journal, check-ins, and career data — not generic tips. Recent activity and in-flight items show what you've been working on.`,
  },
  {
    id: "career-journey",
    title: "Career journey",
    body: `Generate the single realistic trajectory Kursa commits to from your Profile — with milestones, salary estimates, and a timeline. Track milestone progress, use the action queue for what to do next, and open advisor reasoning when you want the why, risks, and evidence.`,
  },
  {
    id: "skills",
    title: "Skills",
    body: `Your skills profile powers journey generation, résumé tailoring, and Aria's advice. Skills gain confidence from résumé import and stay fresh when you log accomplishments that use them. Dormant high-confidence skills appear in Journey pulse if unused for about six months.`,
  },
  {
    id: "aria",
    title: "Aria",
    body: `Aria is your career advisor. Observations on Home and in Journal (under "aria noticed") come from the same intelligence pipeline — LLM-generated from your signals, not templates. The more you capture in Journal, the sharper Aria's read becomes.`,
  },
  {
    id: "journal",
    title: "Journal",
    body: `A place to jot what you want Kursa to know. Use note for general thoughts, accomplishment for something you did that matters (first line = title), and feedback for praise or constructive input you received. Weekly pulse in the sidebar captures how your week felt — complete it when due to feed engagement trends. Review prep turns accomplishments and feedback into performance-review bullets. Aria noticed entries are the system's reflections on your timeline — collapsible so they don't overwhelm your own entries.`,
  },
  {
    id: "roadmap",
    title: "Roadmap",
    body: `Your job-search action plan — what to do next across applications, networking, and skill gaps. (Early access — full experience shipping soon.)`,
  },
  {
    id: "resume",
    title: "Resume studio",
    body: `Tailor résumé versions to roles using your Profile and Career Journey context. Generate, edit, re-score ATS, apply truth-preserving improvement drafts, and download text-based PDFs.`,
  },
  {
    id: "applications",
    title: "Applications",
    body: `Track applications from interest through offer. Keep stage, status, links, notes, and next actions current so active roles appear correctly in dashboard and sidebar signals.`,
  },
] as const;

export default function DocsGuide() {
  const [openId, setOpenId] = useState<string | null>("journal");

  return (
    <div className="flex flex-col gap-2 max-w-2xl">
      <p className="text-sm text-mute mb-4 leading-relaxed">
        How each part of Kursa fits together — and how to get the most from it.
      </p>
      {SECTIONS.map((section) => {
        const open = openId === section.id;
        return (
          <section
            key={section.id}
            id={section.id}
            className="rounded-lg overflow-hidden scroll-mt-6"
            style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : section.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              style={{
                border: "none",
                background: "var(--bg-sub)",
                cursor: "pointer",
                borderBottom: open ? "1px solid var(--line)" : "none",
              }}
            >
              <span className="font-medium text-sm text-ink">{section.title}</span>
              <ChevronDown
                size={14}
                style={{
                  color: "var(--mute-3)",
                  transform: open ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            {open && (
              <div className="px-4 py-3">
                <p className="text-xs text-mute leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
