import { createPrismaClient } from "@kursa/db";
import { env } from "@kursa/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { getAllowedOrigins } from "./allowed-origins.js";

export function createAuth() {
  const prisma = createPrismaClient();
  const allowedOrigins = getAllowedOrigins(env.CORS_ORIGIN);
  const socialProviders = {
    github: {
      clientId: env.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: env.OAUTH_GITHUB_CLIENT_SECRET,
    },
    ...(env.OAUTH_LINKEDIN_CLIENT_ID && env.OAUTH_LINKEDIN_CLIENT_SECRET
      ? {
          linkedin: {
            clientId: env.OAUTH_LINKEDIN_CLIENT_ID,
            clientSecret: env.OAUTH_LINKEDIN_CLIENT_SECRET,
          },
        }
      : {}),
  };

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    trustedOrigins: allowedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
