export const AUTH_APP_NAME = "Kursa";
export const AUTH_BASE_PATH = "/api/auth";
export const AUTH_COOKIE_PREFIX = "kursa";

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;

export const AUTH_SESSION_EXPIRES_IN_SECONDS = 7 * SECONDS_IN_DAY;
export const AUTH_SESSION_UPDATE_AGE_SECONDS = SECONDS_IN_DAY;
export const AUTH_SESSION_FRESH_AGE_SECONDS = SECONDS_IN_DAY;
export const AUTH_SESSION_COOKIE_CACHE_MAX_AGE_SECONDS = 5 * SECONDS_IN_MINUTE;

export type AuthNodeEnv = "development" | "production" | "test";

export function getAuthCookieAttributes(nodeEnv: AuthNodeEnv) {
  const isProduction = nodeEnv === "production";

  return {
    httpOnly: true,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    secure: isProduction,
  };
}

export function getTrustedAccountProviders(socialProviderIds: string[]): string[] {
  return ["email-password", ...new Set(socialProviderIds)].filter(Boolean);
}

export function getAuthRateLimitConfig(nodeEnv: AuthNodeEnv) {
  return {
    // Dev SSR issues many parallel get-session calls per navigation; production-only
    // matches express-rate-limit on /api/v1 in apps/server.
    enabled: nodeEnv === "production",
    window: 60,
    max: 100,
    storage: "memory" as const,
  };
}
