"use client";

import { env } from "@kursa/env/web";
import type { UserSocialLink } from "@kursa/types";

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
  resumeFileName: string;
  rawText: string;
  importedSkills: Array<{ name: string; category: "technical" | "soft" | "tool"; confidenceRating: number }>;
  importedWorkHistory: Array<{ companyName: string; roleTitle: string; outcomes: string; isCurrent: boolean }>;
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

  onboarding: {
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
