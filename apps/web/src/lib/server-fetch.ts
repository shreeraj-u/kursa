import { headers } from "next/headers";

import { env } from "@kursa/env/web";
import type { ApiResponse } from "@kursa/types";

export type ServerFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number };

/**
 * Typed fetch for Next.js server components.
 * Forwards cookies to the backend and unwraps the { success, data } envelope.
 */
const SERVER_FETCH_TIMEOUT_MS = 20_000;

export async function serverFetch<T>(
  path: string,
  options?: { retries?: number; timeoutMs?: number },
): Promise<ServerFetchResult<T>> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";
  const retries = options?.retries ?? 1;
  const timeoutMs = options?.timeoutMs ?? SERVER_FETCH_TIMEOUT_MS;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}${path}`, {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.ok) {
      const json = (await res.json()) as ApiResponse<T>;
      return { ok: true, data: json.data as T };
    }

    if (attempt < retries && (res.status >= 500 || res.status === 429)) {
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
      continue;
    }

    return { ok: false, status: res.status };
  }

  return { ok: false, status: 0 };
}

/** @deprecated Prefer serverFetch and check result.ok */
export async function serverFetchOrNull<T>(path: string): Promise<T | null> {
  const result = await serverFetch<T>(path);
  return result.ok ? result.data : null;
}
