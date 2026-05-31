/**
 * Web origins allowed for CORS and Better Auth trustedOrigins.
 * In development, also allow the localhost ↔ 127.0.0.1 twin (common browser mismatch).
 */
export function getAllowedOrigins(primaryOrigin: string): string[] {
  const origins = new Set<string>([primaryOrigin]);

  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(primaryOrigin);
      const port = url.port ? `:${url.port}` : "";
      if (url.hostname === "localhost") {
        origins.add(`${url.protocol}//127.0.0.1${port}`);
      } else if (url.hostname === "127.0.0.1") {
        origins.add(`${url.protocol}//localhost${port}`);
      }
    } catch {
      // ignore invalid URL
    }
  }

  return [...origins];
}
