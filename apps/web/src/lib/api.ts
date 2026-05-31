"use client";

import { env } from "@kursa/env/web";
import type {
  AchievementInput,
  CareerPath,
  ProactiveNudge,
  ProjectInput,
  RelevanceSummary,
  Resume,
  ResumeContent,
  UserSocialLink,
} from "@kursa/types";

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
  extractionMethod?: "llm" | "taxonomy" | "hybrid";
  warnings?: string[];
  resumeFileName?: string;
  rawText?: string;
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
    complete: (payload: unknown) =>
      request<{ ok: true }>("/api/v1/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    uploadResume: async (formData: FormData): Promise<ResumeUploadResult> => {
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

  journal: {
    timeline: (params?: { page?: number; filter?: "all" | "win" }) =>
      request<{
        data: Array<{
          id: string;
          type: string;
          source: string;
          body: string | null;
          structured: unknown;
          tag: string;
          agent: boolean;
          occurredAt: string;
        }>;
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`/api/v1/journal?page=${params?.page ?? 1}&filter=${params?.filter ?? "all"}`),

    createWin: (body: {
      title: string;
      body: string;
      skillNames?: string[];
      impactMetric?: string;
      collaborators?: string[];
    }) =>
      request<{ event: unknown }>("/api/v1/journal/win", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    createNote: (body: { body: string; mood?: number; tags?: string[] }) =>
      request<{ event: unknown }>("/api/v1/journal/note", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    createFeedback: (body: {
      body: string;
      fromRole?: "manager" | "peer" | "self";
      linkedSkillNames?: string[];
    }) =>
      request<{ event: unknown }>("/api/v1/journal/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    createLearning: (body: {
      skillName: string;
      resourceType?: string;
      hours?: number;
      completed?: boolean;
    }) =>
      request<{ event: unknown }>("/api/v1/journal/learning", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    createDecision: (body: {
      title: string;
      optionsConsidered: string[];
      choiceMade: string;
      reasoning: string;
    }) =>
      request<{ event: unknown }>("/api/v1/journal/decision", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    skills: () => request<{ skills: string[] }>("/api/v1/journal/skills"),

    proactive: () => request<{ nudges: ProactiveNudge[] }>("/api/v1/journal/proactive"),

    memories: () =>
      request<{
        data: Array<{
          id: string;
          category: string;
          fact: string;
          confidence: number;
          validFrom: string;
        }>;
      }>("/api/v1/memory"),

    context: () =>
      request<{
        statusLabel: string;
        company: string | null;
        roleTitle: string | null;
        tenureDays: number | null;
      }>("/api/v1/journal/context"),

    trend: () =>
      request<{ data: Array<{ weekLabel: string; value: number }> }>("/api/v1/journal/trend"),

    relevance: () => request<RelevanceSummary>("/api/v1/journal/relevance"),

    reviewPrep: (from?: string, to?: string) => {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      return request<{
        from: string;
        to: string;
        sections: Array<{
          theme: string;
          bullets: Array<{ text: string; sourceEventId?: string }>;
        }>;
      }>(`/api/v1/journal/review-prep?${q.toString()}`);
    },
  },

  checkins: {
    next: () =>
      request<{
        due: boolean;
        type: "checkin_weekly" | "checkin_monthly" | null;
        questions: Array<{ id: string; label: string; kind: "text" | "scale" }>;
        lastCompletedAt: string | null;
      }>("/api/v1/checkins/next"),

    submit: (body: unknown) =>
      request<{ event: unknown }>("/api/v1/checkins", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  chat: {
    list: () =>
      request<{
        conversations: Array<{
          id: string;
          decisionType: string | null;
          createdAt: string;
          updatedAt: string;
          messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
        }>;
      }>("/api/v1/chat"),

    create: (decisionType?: string) =>
      request<{ id: string }>("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify({ decisionType }),
      }),

    send: (conversationId: string, content: string) =>
      request<{ message: string; conversationId: string }>(`/api/v1/chat/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },

  linkedin: {
    sync: () =>
      request<{ synced: boolean; titleChanged: boolean; newSkills: string[]; message: string }>(
        "/api/v1/linkedin/sync",
        { method: "POST" },
      ),
    status: () => request<{ url: string | null; configured: boolean }>("/api/v1/linkedin/status"),
  },
};
