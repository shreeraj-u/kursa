"use client";

import { env } from "@kursa/env/web";
import type {
  AchievementCreateInput,
  AchievementInput,
  AchievementUpdateInput,
  CareerJourney,
  CareerJourneyResponse,
  JourneyGenerateResponse,
  JourneyIntakeSummary,
  JourneyRevisionBrief,
  JourneyRevisionPreview,
  JourneyRevisionStartRequest,
  JourneyRevisionStartResponse,
  JourneyReviseResponse,
  JourneySetupApplyResponse,
  JourneySetupStartResponse,
  ChatDecisionType,
  ChatMetaResponse,
  ChatSendResponse,
  ConversationListItem,
  EducationCreateInput,
  EducationUpdateInput,
  JourneyPreferences,
  LanguageCreateInput,
  LanguageUpdateInput,
  LearningGoalCreateInput,
  LearningGoalUpdateInput,
  OnboardingReviewResponse,
  ProjectCreateInput,
  ProjectInput,
  ProjectUpdateInput,
  ProactiveNudge,
  RelevanceSummary,
  Resume,
  ResumeContent,
  ResumeImproveAtsResponse,
  SkillCreateInput,
  SkillProposalListResponse,
  SkillsOverviewResponse,
  SkillSummary,
  SkillUpdateInput,
  UserAchievement,
  UserEducation,
  UserLanguage,
  UserLearningGoal,
  UserProject,
  UserSkill,
  UserSocialLink,
  UserWorkHistory,
  WorkHistoryCreateInput,
  WorkHistoryUpdateInput,
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

type ResumeUploadResult = {
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

  dismissDashboardGuide: () =>
    request<{ dashboardGuideCompletedAt: string }>("/api/v1/profile/me/dashboard-guide/dismiss", {
      method: "POST",
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

  // Skill inventory
  createSkill: (body: SkillCreateInput) =>
    request<{ skill: UserSkill }>("/api/v1/profile/me/skills", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateSkill: (id: string, body: SkillUpdateInput) =>
    request<{ skill: UserSkill }>(`/api/v1/profile/me/skills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteSkill: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/skills/${id}`, {
      method: "DELETE",
    }),

  // Learning goals
  createLearningGoal: (body: LearningGoalCreateInput) =>
    request<{ learningGoal: UserLearningGoal }>("/api/v1/profile/me/learning-goals", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateLearningGoal: (id: string, body: LearningGoalUpdateInput) =>
    request<{ learningGoal: UserLearningGoal }>(`/api/v1/profile/me/learning-goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteLearningGoal: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/learning-goals/${id}`, {
      method: "DELETE",
    }),

  createWorkHistory: (body: WorkHistoryCreateInput) =>
    request<{ workHistory: UserWorkHistory }>("/api/v1/profile/me/work-history", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateWorkHistory: (id: string, body: WorkHistoryUpdateInput) =>
    request<{ workHistory: UserWorkHistory }>(`/api/v1/profile/me/work-history/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteWorkHistory: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/work-history/${id}`, {
      method: "DELETE",
    }),

  createProject: (body: ProjectCreateInput) =>
    request<{ project: UserProject }>("/api/v1/profile/me/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProject: (id: string, body: ProjectUpdateInput) =>
    request<{ project: UserProject }>(`/api/v1/profile/me/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteProject: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/projects/${id}`, {
      method: "DELETE",
    }),

  createAchievement: (body: AchievementCreateInput) =>
    request<{ achievement: UserAchievement }>("/api/v1/profile/me/achievements", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateAchievement: (id: string, body: AchievementUpdateInput) =>
    request<{ achievement: UserAchievement }>(`/api/v1/profile/me/achievements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteAchievement: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/achievements/${id}`, {
      method: "DELETE",
    }),

  createEducation: (body: EducationCreateInput) =>
    request<{ education: UserEducation }>("/api/v1/profile/me/education", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateEducation: (id: string, body: EducationUpdateInput) =>
    request<{ education: UserEducation }>(`/api/v1/profile/me/education/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteEducation: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/education/${id}`, {
      method: "DELETE",
    }),

  createLanguage: (body: LanguageCreateInput) =>
    request<{ language: UserLanguage }>("/api/v1/profile/me/languages", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateLanguage: (id: string, body: LanguageUpdateInput) =>
    request<{ language: UserLanguage }>(`/api/v1/profile/me/languages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteLanguage: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/profile/me/languages/${id}`, {
      method: "DELETE",
    }),

  journey: {
    get: () => request<CareerJourneyResponse>("/api/v1/profile/me/journey"),

    intake: () => request<JourneyIntakeSummary>("/api/v1/profile/me/journey/intake"),

    generate: (
      journeyPreferences?: JourneyPreferences,
      source?: "intake" | "quick" | "aria" | "regenerate",
    ) =>
      request<JourneyGenerateResponse>("/api/v1/profile/me/journey/generate", {
        method: "POST",
        body: JSON.stringify({
          ...(journeyPreferences ? { journeyPreferences } : {}),
          ...(source ? { source } : {}),
        }),
      }),

    updateMilestone: (order: number, status: import("@kursa/types").MilestoneStatus | null) =>
      request<{ journey: CareerJourney }>(`/api/v1/profile/me/journey/milestones/${order}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    extend: () =>
      request<{ journey: CareerJourney }>("/api/v1/profile/me/journey/extend", {
        method: "POST",
      }),

    revisionStart: (body?: JourneyRevisionStartRequest) =>
      request<JourneyRevisionStartResponse>("/api/v1/profile/me/journey/revision/start", {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),

    revisionBrief: (conversationId: string) =>
      request<{ brief: JourneyRevisionBrief; preview: JourneyRevisionPreview }>(
        "/api/v1/profile/me/journey/revision/brief",
        {
          method: "POST",
          body: JSON.stringify({ conversationId }),
        },
      ),

    revise: (brief: JourneyRevisionBrief) =>
      request<JourneyReviseResponse>("/api/v1/profile/me/journey/revise", {
        method: "POST",
        body: JSON.stringify(brief),
      }),

    setupStart: () =>
      request<JourneySetupStartResponse>("/api/v1/profile/me/journey/setup/start", {
        method: "POST",
      }),

    setupApply: (conversationId: string, generate = false) =>
      request<JourneySetupApplyResponse>("/api/v1/profile/me/journey/setup/apply", {
        method: "POST",
        body: JSON.stringify({ conversationId, generate }),
      }),
  },

  skills: {
    overview: () => request<SkillsOverviewResponse>("/api/v1/profile/me/skills/overview"),

    create: (body: SkillCreateInput) =>
      request<{ skill: SkillSummary }>("/api/v1/profile/me/skills", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: string, body: SkillUpdateInput) =>
      request<{ skill: SkillSummary }>(`/api/v1/profile/me/skills/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),

    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/v1/profile/me/skills/${id}`, {
        method: "DELETE",
      }),

    proposals: (status: "pending" | "accepted" | "dismissed" = "pending") =>
      request<SkillProposalListResponse>(
        `/api/v1/profile/me/skill-proposals?status=${status}`,
      ),

    acceptProposal: (id: string) =>
      request<{ skill: SkillSummary | null; accepted: boolean }>(
        `/api/v1/profile/me/skill-proposals/${id}/accept`,
        { method: "POST" },
      ),

    dismissProposal: (id: string) =>
      request<{ dismissed: boolean }>(`/api/v1/profile/me/skill-proposals/${id}/dismiss`, {
        method: "POST",
      }),
  },

  resume: {
    list: () =>
      request<{ resumes: Resume[]; quota: { used: number; limit: number } }>(
        "/api/v1/profile/me/resumes",
      ),

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

    improveAts: (id: string) =>
      request<ResumeImproveAtsResponse>(`/api/v1/profile/me/resumes/${id}/improve-ats`, {
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
    list: () => request<{ conversations: ConversationListItem[] }>("/api/v1/chat"),

    meta: () => request<ChatMetaResponse>("/api/v1/chat/meta"),

    suggestedPrompts: () => request<{ prompts: string[] }>("/api/v1/chat/suggested-prompts"),

    create: (decisionType?: ChatDecisionType) =>
      request<{ id: string }>("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify(decisionType ? { decisionType } : {}),
      }),

    send: (conversationId: string, content: string) =>
      request<ChatSendResponse>(`/api/v1/chat/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),

    recordDecision: (
      conversationId: string,
      body: {
        title: string;
        optionsConsidered: string[];
        choiceMade: string;
        reasoning: string;
      },
    ) =>
      request<{ recorded: boolean }>(`/api/v1/chat/${conversationId}/decision`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    delete: (conversationId: string) =>
      request<{ deleted: boolean }>(`/api/v1/chat/${conversationId}`, {
        method: "DELETE",
      }),
  },

  applications: {
    list: () =>
      request<import("@kursa/types").ApplicationListResponse>("/api/v1/profile/me/applications"),

    create: (body: import("@kursa/types").ApplicationCreateInput) =>
      request<{ application: import("@kursa/types").JobApplication }>("/api/v1/profile/me/applications", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: string, body: import("@kursa/types").ApplicationUpdateInput) =>
      request<{ application: import("@kursa/types").JobApplication }>(`/api/v1/profile/me/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/v1/profile/me/applications/${id}`, {
        method: "DELETE",
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

  github: {
    status: () =>
      request<import("@kursa/types").GitHubStatusResponse>("/api/v1/github/status"),
    snapshot: () =>
      request<{ snapshot: import("@kursa/types").GitHubNormalizedSnapshot | null }>(
        "/api/v1/github/snapshot",
      ),
    ingest: () =>
      request<{ scheduled: boolean }>("/api/v1/github/ingest", { method: "POST" }),
    repos: () =>
      request<import("@kursa/types").GitHubSyncPreviewResponse>("/api/v1/github/repos"),
    sync: (body: import("@kursa/types").GitHubSyncConfirmRequest) =>
      request<import("@kursa/types").GitHubSyncSummaryResponse>("/api/v1/github/sync", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  projectProposals: {
    list: (status: "pending" | "accepted" | "dismissed" = "pending") =>
      request<{ data: import("@kursa/types").ProjectProposalSummary[]; total: number }>(
        `/api/v1/profile/me/project-proposals?status=${status}`,
      ),
    accept: (id: string) =>
      request<{ project: { id: string; title: string; url: string | null } }>(
        `/api/v1/profile/me/project-proposals/${id}/accept`,
        { method: "POST" },
      ),
    dismiss: (id: string) =>
      request<{ ok: boolean }>(`/api/v1/profile/me/project-proposals/${id}/dismiss`, {
        method: "POST",
      }),
  },
};
