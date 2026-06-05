import prisma from "@kursa/db";
import type {
  AdvisorContext,
  JourneyGrowthPace,
  JourneyIntakeSource,
  JourneyIntakeSummary,
  JourneyPreferences,
  JourneyPriority,
} from "@kursa/types";
import { journeyPreferencesSchema } from "@kursa/types";

import { assembleAdvisorContext } from "../lib/advisor-context.js";

export type IntakeProfile = {
  id: string;
  bio: string | null;
  targetRole: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  careerTrajectory: string | null;
  values: unknown;
  aspirations: unknown;
  onboardingDone: boolean;
  skills: Array<{ name: string; confidenceRating: number | null; source: string | null }>;
  workHistories: Array<{
    roleTitle: string;
    companyName: string;
    isCurrent: boolean;
    outcomes: unknown;
  }>;
  socialLinks: Array<{ platform: string }>;
};

const PROFILE_SELECT = {
  id: true,
  bio: true,
  targetRole: true,
  location: true,
  yearsOfExperience: true,
  careerTrajectory: true,
  values: true,
  aspirations: true,
  onboardingDone: true,
  skills: {
    select: { name: true, confidenceRating: true, source: true },
    orderBy: { confidenceRating: "desc" as const },
    take: 12,
  },
  workHistories: {
    select: {
      roleTitle: true,
      companyName: true,
      isCurrent: true,
      outcomes: true,
    },
    orderBy: { startDate: "desc" as const },
  },
  socialLinks: {
    select: { platform: true },
  },
} as const;

async function loadIntakeProfile(userId: string): Promise<IntakeProfile | null> {
  return prisma.profile.findUnique({
    where: { userId },
    select: PROFILE_SELECT,
  });
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function currentRoleFromProfile(profile: IntakeProfile): string | null {
  const current = profile.workHistories.find((w) => w.isCurrent);
  if (current) return current.roleTitle;
  return profile.workHistories[0]?.roleTitle ?? null;
}

function aspirationSnippet(aspirations: unknown): string | null {
  const asp = readRecord(aspirations);
  if (!asp) return null;
  return (
    readString(asp.horizon3y) ??
    readString(asp.threeYear) ??
    readString(asp.definitionOfSuccess) ??
    readString(asp.successDefinition) ??
    null
  );
}

function constraintsSnippet(values: unknown): string | null {
  const vals = readRecord(values);
  if (!vals) return null;

  const parts: string[] = [];
  const constraints = readString(vals.constraints) ?? readString(vals.geographicConstraints);
  if (constraints) parts.push(constraints);

  const workEnv = readString(vals.workEnvironment);
  if (workEnv) parts.push(`${workEnv} work`);

  const geo = readStringArray(vals.geographicConstraints);
  if (geo.length > 0) parts.push(geo.join(", "));

  return parts.length > 0 ? parts.join(" · ") : null;
}

function detectSources(profile: IntakeProfile, context: AdvisorContext | null): JourneyIntakeSource[] {
  const sources: JourneyIntakeSource[] = [];

  if (profile.onboardingDone) sources.push("onboarding");

  const hasResumeSkills = profile.skills.some((s) => s.source === "resume");
  if (hasResumeSkills || profile.workHistories.length >= 2) {
    sources.push("resume");
  }

  const hasGithub = profile.socialLinks.some((l) => l.platform === "github");
  if (hasGithub || context?.githubSlice) {
    sources.push("github");
  }

  const hasJournal =
    context?.recentEvents.some((e) => e.type === "note" || e.type === "checkin_weekly") ?? false;
  if (hasJournal) sources.push("journal");

  return [...new Set(sources)];
}

function inferGrowthPace(
  careerTrajectory: string | null,
  values: unknown,
): JourneyGrowthPace {
  const vals = readRecord(values);
  const risk = readString(vals?.riskAppetite);

  if (risk === "high_growth") return "accelerated";
  if (risk === "stability_seeking") return "steady";

  const trajectory = (careerTrajectory ?? "").toLowerCase();
  if (trajectory.includes("accelerat") || trajectory.includes("fast")) return "accelerated";
  if (trajectory.includes("stagnat") || trajectory.includes("plateau")) return "exploratory";
  if (trajectory.includes("steady") || trajectory.includes("stable")) return "steady";

  return "";
}

function inferPriorities(values: unknown, aspirations: unknown): JourneyPriority[] {
  const vals = readRecord(values);
  const asp = readRecord(aspirations);
  const priorities: JourneyPriority[] = [];

  const success = readString(asp?.definitionOfSuccess) ?? readString(asp?.successDefinition) ?? "";
  const horizon = readString(asp?.horizon3y) ?? readString(asp?.threeYear) ?? "";
  const combined = `${success} ${horizon}`.toLowerCase();

  if (/\b(lead|manager|director|head of|em\b)/.test(combined)) priorities.push("leadership");
  if (vals?.minSalary != null || vals?.maxSalary != null) priorities.push("salary");

  const workEnv = readString(vals?.workEnvironment);
  if (workEnv === "remote") priorities.push("remote");
  if (workEnv === "startup") priorities.push("impact", "autonomy");

  const risk = readString(vals?.riskAppetite);
  if (risk === "stability_seeking") priorities.push("stability");
  if (risk === "high_growth") priorities.push("learning", "impact");

  if (/\b(learn|skill|grow|master)\b/.test(combined)) priorities.push("learning");
  if (/\b(remote|relocat|location|move)\b/.test(combined)) priorities.push("location");
  if (/\b(autonom|independ|own)\b/.test(combined)) priorities.push("autonomy");
  if (/\b(impact|mission|purpose)\b/.test(combined)) priorities.push("impact");

  return [...new Set(priorities)].slice(0, 3);
}

/**
 * Rule-based preference inference from profile, onboarding, and advisor context.
 * Exported for unit tests.
 */
export function inferJourneyPreferences(profile: IntakeProfile): JourneyPreferences {
  const aspirations = profile.aspirations;
  const values = profile.values;
  const asp = readRecord(aspirations);
  const vals = readRecord(values);

  const targetRoles = readStringArray(asp?.targetRoles);
  const targetRole = profile.targetRole?.trim() ?? "";
  const preferredDirection =
    targetRole ||
    targetRoles[0] ||
    readString(asp?.horizon3y) ||
    readString(asp?.threeYear) ||
    "";

  const leanParts: string[] = [];
  const industries = readStringArray(asp?.targetIndustries);
  if (industries.length > 0) leanParts.push(`Industries: ${industries.slice(0, 3).join(", ")}`);
  const horizon = readString(asp?.horizon3y) ?? readString(asp?.threeYear);
  if (horizon && horizon !== preferredDirection) leanParts.push(horizon);
  const fiveYear = readString(asp?.horizon5y) ?? readString(asp?.fiveYear);
  if (fiveYear) leanParts.push(`5y: ${fiveYear}`);

  const hardConstraints = constraintsSnippet(values) ?? "";
  const avoid =
    readString(vals?.constraints) && workEnvAvoid(vals?.workEnvironment)
      ? `Prefer to avoid: ${workEnvAvoid(vals?.workEnvironment)}`
      : "";

  const raw = {
    preferredDirection,
    leanToward: leanParts.join(" · "),
    avoid,
    growthPace: inferGrowthPace(profile.careerTrajectory, values),
    priorities: inferPriorities(values, aspirations),
    hardConstraints,
    notes: "",
  };

  const parsed = journeyPreferencesSchema.safeParse(raw);
  return parsed.success ? parsed.data : journeyPreferencesSchema.parse({});
}

function findRecentWin(context: AdvisorContext | null): string | null {
  if (!context) return null;

  const quarterAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const winEvent = context.recentEvents.find(
    (e) => e.type === "win" && new Date(e.occurredAt).getTime() >= quarterAgo,
  );
  if (winEvent?.body) return winEvent.body;

  const achievementMemory = context.memories.find((m) => m.category === "achievement_theme");
  return achievementMemory?.fact ?? null;
}

function workEnvAvoid(workEnvironment: unknown): string | null {
  if (workEnvironment === "corporate") return "heavy bureaucracy without scope";
  if (workEnvironment === "startup") return "early-stage chaos without mentorship";
  return null;
}

export function buildIntakeSummary(
  profile: IntakeProfile,
  context: AdvisorContext | null,
): JourneyIntakeSummary {
  const inferredPreferences = inferJourneyPreferences(profile);
  const topSkills = profile.skills
    .sort((a, b) => (b.confidenceRating ?? 0) - (a.confidenceRating ?? 0))
    .slice(0, 5)
    .map((s) => s.name);

  const recentWin = findRecentWin(context);

  return {
    currentRole: currentRoleFromProfile(profile),
    targetRole: profile.targetRole,
    aspirationSnippet: aspirationSnippet(profile.aspirations),
    topSkills,
    recentWin,
    constraintsSnippet: constraintsSnippet(profile.values),
    sources: detectSources(profile, context),
    inferredPreferences,
  };
}

export async function getJourneyIntake(userId: string): Promise<JourneyIntakeSummary | null> {
  const [profile, context] = await Promise.all([
    loadIntakeProfile(userId),
    assembleAdvisorContext(userId, "paths"),
  ]);

  if (!profile) return null;
  return buildIntakeSummary(profile, context);
}
