import type { ResumeContent, ResumeSectionKey } from "@kursa/types";

export const DEFAULT_RESUME_SECTION_ORDER: ResumeSectionKey[] = [
  "summary",
  "experience",
  "skills",
  "education",
  "certifications",
  "projects",
];

export const RESUME_SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
  projects: "Projects",
};

export function normalizeResumeSectionOrder(content: Pick<ResumeContent, "sectionOrder">): ResumeSectionKey[] {
  const seen = new Set<ResumeSectionKey>();
  const order: ResumeSectionKey[] = [];

  for (const section of content.sectionOrder ?? []) {
    if (DEFAULT_RESUME_SECTION_ORDER.includes(section) && !seen.has(section)) {
      seen.add(section);
      order.push(section);
    }
  }

  for (const section of DEFAULT_RESUME_SECTION_ORDER) {
    if (!seen.has(section)) order.push(section);
  }

  return order;
}
