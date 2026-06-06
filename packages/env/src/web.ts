import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  client: {},
  runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.NEXT_PHASE === "phase-production-build",
});
