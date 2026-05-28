import { headers } from "next/headers";

import { env } from "@kursa/env/web";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Typed fetch for Next.js server components.
 * Forwards cookies to the backend and unwraps the { success, data } envelope.
 * Returns null on any non-ok response.
 */
export async function serverFetch<T>(path: string): Promise<T | null> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";

  const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}${path}`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as ApiResponse<T>;
  return json.data ?? null;
}
