import { createPrismaClient } from "@kursa/db";
import { env } from "@kursa/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { getAllowedOrigins } from "./allowed-origins.js";
import {
  AUTH_APP_NAME,
  AUTH_BASE_PATH,
  AUTH_COOKIE_PREFIX,
  AUTH_SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
  AUTH_SESSION_EXPIRES_IN_SECONDS,
  AUTH_SESSION_FRESH_AGE_SECONDS,
  AUTH_SESSION_UPDATE_AGE_SECONDS,
  getAuthCookieAttributes,
  getAuthRateLimitConfig,
  getTrustedAccountProviders,
} from "./config.js";

export function createAuth() {
  const prisma = createPrismaClient();
  const allowedOrigins = getAllowedOrigins(env.CORS_ORIGIN, env.NODE_ENV);
  const socialProviders = {
    github: {
      clientId: env.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: env.OAUTH_GITHUB_CLIENT_SECRET,
      // Required for listing/importing user repositories after OAuth link or sign-in.
      scope: ["repo"],
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

  const socialProviderIds = Object.keys(socialProviders);

  return betterAuth({
    appName: AUTH_APP_NAME,
    basePath: AUTH_BASE_PATH,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    trustedOrigins: allowedOrigins,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    socialProviders,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    session: {
      expiresIn: AUTH_SESSION_EXPIRES_IN_SECONDS,
      updateAge: AUTH_SESSION_UPDATE_AGE_SECONDS,
      freshAge: AUTH_SESSION_FRESH_AGE_SECONDS,
      cookieCache: {
        enabled: true,
        maxAge: AUTH_SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
        strategy: "jwe",
      },
    },
    account: {
      encryptOAuthTokens: true,
      updateAccountOnSignIn: true,
      storeStateStrategy: "database",
      accountLinking: {
        enabled: true,
        trustedProviders: getTrustedAccountProviders(socialProviderIds),
        // GitHub email may differ from the email used at sign-up.
        allowDifferentEmails: true,
        allowUnlinkingAll: false,
        updateUserInfoOnLink: false,
      },
    },
    rateLimit: getAuthRateLimitConfig(env.NODE_ENV),
    advanced: {
      useSecureCookies: env.NODE_ENV === "production",
      cookiePrefix: AUTH_COOKIE_PREFIX,
      defaultCookieAttributes: getAuthCookieAttributes(env.NODE_ENV),
    },
    plugins: [],
  });
}

export const auth = createAuth();
