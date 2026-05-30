import type { AchievementType, ResumeAchievement, ResumeContent, ResumeSectionKey } from "@kursa/types";

export const DEFAULT_RESUME_SECTION_ORDER: ResumeSectionKey[] = [
  "summary",
  "skills",
  "experience",
  "projects",
  "others",
  "education",
  "certifications",
];

export const RESUME_SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
  projects: "Projects",
  others: "Others",
};

// Human-readable, pluralised labels for the grouped "Others" section. Shared by
// the preview and PDF renderers so the two never drift.
export const ACHIEVEMENT_TYPE_LABELS: Record<AchievementType, string> = {
  HACKATHON: "Hackathons",
  AWARD: "Awards",
  PUBLICATION: "Publications",
  SPEAKING: "Speaking",
  OPEN_SOURCE: "Open Source",
  VOLUNTEER: "Volunteering",
  OTHER: "Other",
};

// Order types appear within the Others section.
const ACHIEVEMENT_TYPE_ORDER: AchievementType[] = [
  "HACKATHON",
  "AWARD",
  "PUBLICATION",
  "SPEAKING",
  "OPEN_SOURCE",
  "VOLUNTEER",
  "OTHER",
];

/** Group achievements by type into compact `{ label, items }` lines for rendering. */
export function groupAchievements(
  achievements: ResumeAchievement[] | undefined,
): Array<{ type: AchievementType; label: string; titles: string[] }> {
  if (!achievements || achievements.length === 0) return [];
  const byType = new Map<AchievementType, string[]>();
  for (const a of achievements) {
    if (!a.title) continue;
    const list = byType.get(a.type) ?? [];
    list.push(a.title);
    byType.set(a.type, list);
  }
  return ACHIEVEMENT_TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({
    type: t,
    label: ACHIEVEMENT_TYPE_LABELS[t],
    titles: byType.get(t) as string[],
  }));
}

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
