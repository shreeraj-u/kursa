"use client";

import { env } from "@kursa/env/web";
import type { CareerPath, Resume, ResumeContent, UserSocialLink, AchievementInput, OnboardingReviewResponse, ProjectInput } from "@kursa/types";

const BASE = env.NEXT_PUBLIC_SERVER_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}

export type ResumeUploadResult = {
  importedSkills: Array<{ name: string; category: "technical" | "soft" | "tool"; confidenceRating: number }>;
  importedWorkHistory: Array<{ companyName: string; roleTitle: string; outcomes: string; startDate: string | null; endDate: string | null; isCurrent: boolean }>;
  importedProjects: ProjectInput[];
  importedAchievements: AchievementInput[];
  importedEducation: Array<{ type: "degree" | "certification" | "course"; credentialName: string; issuer: string; completionDate: string | null }>;
  importedLanguages: Array<{ name: string; proficiency: "Native" | "Fluent" | "Conversational" | "Basic" }>;
  importedSocialLinks: Array<{ platform: "github" | "linkedin" | "twitter" | "website" | "portfolio"; url: string }>;
  importedBasics: { bio: string | null; location: string | null };
  skillsFound: number;
};

export const api = {
  updateProfile: (body: unknown) =>
    request<{ profile: unknown }>("/api/v1/profile/me", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  createSocialLink: (body: { platform: string; url: string }) =>
    request<{ socialLink: UserSocialLink }>("/api/v1/profile/me/social-links", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateSocialLink: (id: string, body: { url: string }) =>
    request<{ socialLink: UserSocialLink }>(`/api/v1/profile/me/social-links/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteSocialLink: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/social-links/${id}`, {
      method: "DELETE",
    }),

  paths: {
    generate: () =>
      request<{ paths: CareerPath[] }>("/api/v1/profile/me/paths/generate", {
        method: "POST",
      }),

    activate: (id: string) =>
      request<{ paths: CareerPath[] }>(`/api/v1/profile/me/paths/${id}/activate`, {
        method: "PUT",
      }),
  },

  resume: {
    generate: () =>
      request<{ resume: Resume }>("/api/v1/profile/me/resumes/generate", {
        method: "POST",
      }),

    update: (id: string, content: ResumeContent) =>
      request<{ resume: Resume }>(`/api/v1/profile/me/resumes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      }),

    analyze: (id: string) =>
      request<{ resume: Resume }>(`/api/v1/profile/me/resumes/${id}/analyze`, {
        method: "POST",
      }),
  },

  onboarding: {
    review: (payload: unknown) =>
      request<OnboardingReviewResponse>("/api/v1/onboarding/review", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    complete: (payload: unknown) =>
      request<{ ok: true }>("/api/v1/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    uploadResume: async (formData: FormData): Promise<ResumeUploadResult> => {
      // No Content-Type header — let the browser set the multipart boundary
      const res = await fetch(`${BASE}/api/v1/onboarding/resume`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(json?.error?.message ?? `Upload failed (${res.status})`);
      }
      const json = (await res.json()) as { data: ResumeUploadResult };
      return json.data;
    },
  },
};
