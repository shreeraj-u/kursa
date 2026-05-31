import { onboardingPayloadSchema } from "@kursa/types";

export * from "@kursa/types";

export const completeOnboardingSchema = onboardingPayloadSchema;
export type CompleteOnboardingInput = import("@kursa/types").OnboardingPayload;
