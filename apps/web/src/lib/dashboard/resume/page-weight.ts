import type { ResumeContent } from "@kursa/types";

export const PAGE_FIT_WARNING_THRESHOLD = 112;

export function estimatePageWeight(content: ResumeContent): number {
  const projects = content.projects ?? [];
  const summaryWeight = Math.ceil(content.summary.length / 95);
  const bulletWeight = content.experience.reduce(
    (total, exp) => total + exp.bullets.reduce((sum, bullet) => sum + 4 + Math.ceil(bullet.length / 90), 0),
    0,
  );
  const roleWeight = content.experience.length * 7;
  const projectWeight = projects.reduce(
    (total, project) =>
      total +
      5 +
      Math.ceil(
        (project.title.length +
          project.description.length +
          (project.period?.length ?? 0) +
          (project.url?.length ?? 0) +
          (project.bullets ?? []).join(" ").length) /
          120,
      ),
    0,
  );
  const credentialWeight = (content.education.length + content.certifications.length) * 3;
  const achievementCount = content.achievements?.length ?? 0;
  const achievementWeight = achievementCount > 0 ? 3 + Math.ceil(achievementCount / 3) : 0;
  const skillsWeight = Math.ceil(content.skills.length / 4);
  const contactWeight = Math.ceil(
    [content.contact.email, content.contact.location, ...content.contact.links]
      .filter(Boolean)
      .join(" ").length / 120,
  );

  return summaryWeight + bulletWeight + roleWeight + projectWeight + credentialWeight + achievementWeight + skillsWeight + contactWeight;
}
