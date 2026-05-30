import { z } from "zod";

// --- output bounds (guardrails) ---
export const MAX_ROLES = 6;
export const MAX_BULLETS = 5;
export const MAX_SKILLS = 20;
export const MAX_EDUCATION = 5;
export const MAX_CERTIFICATIONS = 5;
export const MAX_PROJECTS = 4;
export const MAX_ACHIEVEMENTS = 12;

export const sectionKeySchema = z.enum([
  "summary",
  "experience",
  "skills",
  "education",
  "certifications",
  "projects",
  "others",
]);

export const achievementTypeSchema = z.enum([
  "HACKATHON",
  "AWARD",
  "PUBLICATION",
  "SPEAKING",
  "OPEN_SOURCE",
  "VOLUNTEER",
  "OTHER",
]);

export const experienceSchema = z.object({
  company: z.string().min(1),
  roleTitle: z.string().min(1),
  period: z.string().min(1),
  bullets: z.array(z.string().min(1)).max(MAX_BULLETS),
});

export const resumeContentSchema = z.object({
  fullName: z.string().min(1),
  contact: z.object({
    email: z.string().nullish().transform((v) => v ?? undefined),
    location: z.string().nullish().transform((v) => v ?? undefined),
    links: z.array(z.string()).default([]),
  }),
  summary: z.string().default(""),
  experience: z.array(experienceSchema).max(MAX_ROLES).default([]),
  skills: z.array(z.string()).max(MAX_SKILLS).default([]),
  education: z
    .array(
      z.object({
        credential: z.string().min(1),
        issuer: z.string().min(1),
        year: z.string().nullish().transform((v) => v ?? undefined),
      }),
    )
    .max(MAX_EDUCATION)
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().min(1),
        issuer: z.string().min(1),
        year: z.string().nullish().transform((v) => v ?? undefined),
      }),
    )
    .max(MAX_CERTIFICATIONS)
    .default([]),
  projects: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().default(""),
        period: z.string().nullish().transform((v) => v ?? undefined),
        url: z.string().nullish().transform((v) => v ?? undefined),
        bullets: z.array(z.string().min(1)).max(3).optional(),
      }),
    )
    .max(MAX_PROJECTS)
    .optional(),
  achievements: z
    .array(
      z.object({
        type: achievementTypeSchema,
        title: z.string().min(1),
        issuer: z.string().nullish().transform((v) => v ?? undefined),
        url: z.string().nullish().transform((v) => v ?? undefined),
        year: z.string().nullish().transform((v) => v ?? undefined),
      }),
    )
    .max(MAX_ACHIEVEMENTS)
    .optional(),
  sectionOrder: z.array(sectionKeySchema).optional(),
});

export const atsIssueSchema = z.object({
  severity: z.enum(["high", "medium", "low"]),
  message: z.string().min(1),
  fix: z.string().min(1),
});

export const atsResponseSchema = z.object({
  atsScore: z.number().min(0).max(100),
  issues: z.array(atsIssueSchema).max(6).default([]),
});
