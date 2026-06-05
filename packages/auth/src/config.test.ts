import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getAuthCookieAttributes,
  getAuthRateLimitConfig,
  getTrustedAccountProviders,
} from "./config.ts";

void describe("auth config helpers", () => {
  void it("uses cross-site secure cookies in production", () => {
    assert.deepEqual(getAuthCookieAttributes("production"), {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
  });

  void it("uses lax non-secure cookies outside production", () => {
    assert.deepEqual(getAuthCookieAttributes("development"), {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
  });

  void it("deduplicates trusted account linking providers and keeps email-password", () => {
    assert.deepEqual(getTrustedAccountProviders(["github", "github", "linkedin"]), [
      "email-password",
      "github",
      "linkedin",
    ]);
  });

  void it("enables in-process auth rate limiting", () => {
    assert.deepEqual(getAuthRateLimitConfig(), {
      enabled: true,
      window: 60,
      max: 100,
      storage: "memory",
    });
  });
});
