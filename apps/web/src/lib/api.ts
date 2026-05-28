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
};
