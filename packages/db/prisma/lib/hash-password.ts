import { hashPassword as hashPasswordBetterAuth } from "@better-auth/utils/password";

/** Hash passwords the same way Better Auth does for email/password sign-in. */
export function hashPassword(password: string) {
  return hashPasswordBetterAuth(password);
}
