import React from "react";
import type { ResumeContent, ResumeSectionKey } from "@kursa/types";

import { groupAchievements, normalizeResumeSectionOrder } from "@/lib/dashboard/resume/section-order";

interface ResumeDocumentProps {
  content: ResumeContent;
}

// Renders a premium "Classic Elegant Serif" paper document (white sheet, Georgia/
// Times serif, black-on-white) that mirrors the downloadable PDF exactly — not
// dashboard UI. Self-contained colors so it reads as a real résumé regardless of
// app theme. resume-pdf.tsx must stay visually in lock-step with this file.

const INK = "#1a1a1a";
const MUTE = "#5a5a5a";
const RULE = "#bfbfbf";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-[11px]">
      <div
        className="text-[10px] font-bold uppercase pb-[2px] mb-[6px] border-b"
        style={{ letterSpacing: "2px", color: INK, borderColor: RULE }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default function ResumeDocument({ content }: ResumeDocumentProps) {
  const contactParts = [
    content.contact.email,
    content.contact.location,
    ...content.contact.links,
  ].filter(Boolean);

  const achievementGroups = groupAchievements(content.achievements);

  const sectionRenderers: Record<ResumeSectionKey, React.ReactNode> = {
    summary: content.summary ? (
      <Section title="Summary">
        <p className="m-0" style={{ color: INK }}>
          {content.summary}
        </p>
      </Section>
    ) : null,
    experience: content.experience.length > 0 ? (
      <Section title="Experience">
        {content.experience.map((exp, i) => (
          <div key={i} className="mb-[8px] last:mb-0">
            <div className="flex justify-between items-baseline gap-3">
              <span style={{ color: INK }}>
                <span className="font-bold">{exp.roleTitle}</span>
                <span> · {exp.company}</span>
              </span>
              <span className="text-[10px] italic whitespace-nowrap" style={{ color: MUTE }}>
                {exp.period}
              </span>
            </div>
            <ul className="mt-[3px] pl-0 list-none">
              {exp.bullets.map((b, j) => (
                <li key={j} className="mb-[2px] pl-[14px] relative" style={{ color: INK }}>
                  <span className="absolute left-0" style={{ color: MUTE }}>
                    –
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    ) : null,
    skills: content.skills.length > 0 ? (
      <Section title="Skills">
        <div style={{ color: INK }}>{content.skills.join("  ·  ")}</div>
      </Section>
    ) : null,
    education: content.education.length > 0 ? (
      <Section title="Education">
        {content.education.map((e, i) => (
          <div key={i} className="flex justify-between items-baseline gap-3 mb-[2px]">
            <span style={{ color: INK }}>
              <strong className="font-bold">{e.credential}</strong> · {e.issuer}
            </span>
            {e.year && (
              <span className="text-[10px] italic whitespace-nowrap" style={{ color: MUTE }}>
                {e.year}
              </span>
            )}
          </div>
        ))}
      </Section>
    ) : null,
    certifications: content.certifications.length > 0 ? (
      <Section title="Certifications">
        {content.certifications.map((c, i) => (
          <div key={i} className="flex justify-between items-baseline gap-3 mb-[2px]">
            <span style={{ color: INK }}>
              <strong className="font-bold">{c.name}</strong> · {c.issuer}
            </span>
            {c.year && (
              <span className="text-[10px] italic whitespace-nowrap" style={{ color: MUTE }}>
                {c.year}
              </span>
            )}
          </div>
        ))}
      </Section>
    ) : null,
    projects: content.projects && content.projects.length > 0 ? (
      <Section title="Projects">
        {content.projects.map((p, i) => (
          <div key={i} className="mb-[8px] last:mb-0">
            <div className="flex justify-between items-baseline gap-3">
              <span style={{ color: INK }}>
                <span className="font-bold">{p.title}</span>
                {p.url && (
                  <span className="text-[10px] ml-2" style={{ color: MUTE }}>
                    {p.url}
                  </span>
                )}
              </span>
              {p.period && (
                <span className="text-[10px] italic whitespace-nowrap" style={{ color: MUTE }}>
                  {p.period}
                </span>
              )}
            </div>
            {p.description && (
              <div className="mt-[1px]" style={{ color: INK }}>
                {p.description}
              </div>
            )}
            {p.bullets && p.bullets.length > 0 && (
              <ul className="mt-[2px] pl-0 list-none">
                {p.bullets.map((b, j) => (
                  <li key={j} className="mb-[2px] pl-[14px] relative" style={{ color: INK }}>
                    <span className="absolute left-0" style={{ color: MUTE }}>
                      –
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </Section>
    ) : null,
    others: achievementGroups.length > 0 ? (
      <Section title="Others">
        {achievementGroups.map((g) => (
          <div key={g.type} className="mb-[2px]" style={{ color: INK }}>
            <strong className="font-bold">{g.label}:</strong> {g.titles.join(", ")}
          </div>
        ))}
      </Section>
    ) : null,
  };

  return (
    <div
      className="mx-auto py-[40px] px-[48px] font-serif text-[11px] leading-[1.4]"
      style={{
        backgroundColor: "#ffffff",
        color: INK,
        maxWidth: "740px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
      }}
    >
      <div className="text-center mb-[4px]">
        <div className="text-[25px] font-bold" style={{ letterSpacing: "0.5px" }}>
          {content.fullName}
        </div>
        {contactParts.length > 0 && (
          <div className="text-[10px] mt-[4px]" style={{ color: MUTE }}>
            {contactParts.join("  ·  ")}
          </div>
        )}
      </div>

      {normalizeResumeSectionOrder(content).map((section) => (
        <React.Fragment key={section}>{sectionRenderers[section]}</React.Fragment>
      ))}
    </div>
  );
}
