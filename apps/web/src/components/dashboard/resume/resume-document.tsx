import React from "react";
import type { ResumeContent, ResumeSectionKey } from "@kursa/types";

import { normalizeResumeSectionOrder } from "@/lib/dashboard/resume/section-order";

interface ResumeDocumentProps {
  content: ResumeContent;
}

// Renders a realistic paper document (white sheet, document typography,
// black-on-white) that mirrors the downloadable PDF — not dashboard UI.
// Self-contained colors so it reads as a real résumé regardless of app theme.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-[9px]">
      <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#1a1a1a] border-b border-[#d4d4d4] pb-[2px] mb-[5px]">
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

  const sectionRenderers: Record<ResumeSectionKey, React.ReactNode> = {
    summary: content.summary ? (
      <Section title="Summary">
        <p className="m-0 text-[#1a1a1a]">{content.summary}</p>
      </Section>
    ) : null,
    experience: content.experience.length > 0 ? (
      <Section title="Experience">
        {content.experience.map((exp, i) => (
          <div key={i} className="mb-[7px]">
            <div className="flex justify-between items-baseline">
              <span className="font-bold">
                {exp.roleTitle}
                <span className="font-normal"> · {exp.company}</span>
              </span>
              <span className="text-[10.5px] text-[#555] italic">
                {exp.period}
              </span>
            </div>
            <ul className="mt-[2px] pl-[16px] list-disc">
              {exp.bullets.map((b, j) => (
                <li key={j} className="mb-[1px]">
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
        <div>{content.skills.join("  ·  ")}</div>
      </Section>
    ) : null,
    education: content.education.length > 0 ? (
      <Section title="Education">
        {content.education.map((e, i) => (
          <div key={i} className="flex justify-between mb-[1px]">
            <span>
              <strong className="font-bold">{e.credential}</strong> · {e.issuer}
            </span>
            {e.year && <span className="text-[#555] italic">{e.year}</span>}
          </div>
        ))}
      </Section>
    ) : null,
    certifications: content.certifications.length > 0 ? (
      <Section title="Certifications">
        {content.certifications.map((c, i) => (
          <div key={i} className="flex justify-between mb-[1px]">
            <span>
              <strong className="font-bold">{c.name}</strong> · {c.issuer}
            </span>
            {c.year && <span className="text-[#555] italic">{c.year}</span>}
          </div>
        ))}
      </Section>
    ) : null,
    projects: content.projects && content.projects.length > 0 ? (
      <Section title="Projects">
        {content.projects.map((p, i) => (
          <div key={i} className="mb-[3px]">
            <span className="font-bold">{p.title}</span>
            {p.description && <span> — {p.description}</span>}
          </div>
        ))}
      </Section>
    ) : null,
  };

  return (
    <div className="bg-[#ffffff] text-[#1a1a1a] max-w-[720px] mx-auto py-[34px] px-[42px] font-serif text-[11.5px] leading-[1.32] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="text-center mb-[2px]">
        <div className="text-[22px] font-bold tracking-[0.4px]">
          {content.fullName}
        </div>
        {contactParts.length > 0 && (
          <div className="text-[10.5px] text-[#555] mt-[2px]">
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
