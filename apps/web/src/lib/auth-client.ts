import { createAuthClient } from "better-auth/react";

const baseURL =
  typeof window === "undefined"
    ? (process.env.SERVER_INTERNAL_URL ?? "http://127.0.0.1:3000")
    : undefined;

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  fetchOptions: {
    credentials: "include",
  },
});
