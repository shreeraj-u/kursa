export type AllowedOriginsEnv = "development" | "production" | "test";

function parseOriginList(origins: string): string[] {
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function addDevelopmentTwin(origins: Set<string>, origin: string): void {
  try {
    const url = new URL(origin);
    const port = url.port ? `:${url.port}` : "";
    if (url.hostname === "localhost") {
      origins.add(`${url.protocol}//127.0.0.1${port}`);
    } else if (url.hostname === "127.0.0.1") {
      origins.add(`${url.protocol}//localhost${port}`);
    }
  } catch {
    // Environment validation rejects invalid URLs. Keep this helper defensive for tests and tooling.
  }
}

/**
 * Web origins allowed for CORS and Better Auth trustedOrigins.
 * Accepts a comma-separated list for multi-domain deployments. In development,
 * also allow the localhost ↔ 127.0.0.1 twin for common browser mismatches.
 */
export function getAllowedOrigins(
  configuredOrigins: string,
  nodeEnv: AllowedOriginsEnv = process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development",
): string[] {
  const origins = new Set(parseOriginList(configuredOrigins));

  if (nodeEnv !== "production") {
    for (const origin of [...origins]) {
      addDevelopmentTwin(origins, origin);
    }
  }

  return [...origins];
}

export function isValidOriginList(configuredOrigins: string): boolean {
  const origins = parseOriginList(configuredOrigins);

  return origins.length > 0 && origins.every((origin) => {
    try {
      new URL(origin);
      return true;
    } catch {
      return false;
    }
  });
}
