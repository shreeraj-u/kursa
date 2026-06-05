import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function isValidOriginList(configuredOrigins: string): boolean {
    const origins = configuredOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return origins.length > 0 && origins.every((origin) => {
        try {
            new URL(origin);
            return true;
        } catch {
            return false;
        }
    });
}

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().min(1),
        BETTER_AUTH_SECRET: z.string().min(32),
        BETTER_AUTH_URL: z.url(),
        CORS_ORIGIN: z.string().min(1).refine(isValidOriginList, "Must be a comma-separated list of valid URL origins"),
        NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
        OAUTH_GITHUB_CLIENT_ID: z.string(),
        OAUTH_GITHUB_CLIENT_SECRET: z.string(),
        OPENAI_API_KEY: z.string().min(1),
        REDIS_URL: z.string().url().optional(),
        OAUTH_LINKEDIN_CLIENT_ID: z.string().optional(),
        OAUTH_LINKEDIN_CLIENT_SECRET: z.string().optional(),
        BLS_API_KEY: z.string().optional(),
        ADZUNA_APP_ID: z.string().optional(),
        ADZUNA_APP_KEY: z.string().optional(),
        ONET_USERNAME: z.string().optional(),
        ONET_PASSWORD: z.string().optional(),
        CAREERONESTOP_USER_ID: z.string().optional(),
        CAREERONESTOP_API_TOKEN: z.string().optional(),
        MARKET_ENABLED: z.enum(["true", "false"]).optional(),
        CHAT_LEARN_MAX_PER_DAY: z.coerce.number().int().positive().optional(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    // Compile without real secrets during `next build` / explicit opt-out.
    // Runtime still validates because neither flag is set when serving.
    skipValidation:
        !!process.env.SKIP_ENV_VALIDATION ||
        process.env.NEXT_PHASE === "phase-production-build",
});
