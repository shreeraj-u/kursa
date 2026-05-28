import type { UserProfile } from "@kursa/types";

export function normalizeCareerDefaults(profile: UserProfile | null) {
  const v = profile?.values;
  const a = profile?.aspirations;
  return {
    targetRole: profile?.targetRole ?? "",
    yearsOfExperience: profile?.yearsOfExperience ?? null,
    workEnvironment: v?.workEnvironment ?? "",
    riskAppetite: v?.riskAppetite ?? "",
    teamSizePreference: v?.teamSizePreference ?? "",
    minSalary: v?.minSalary ?? null,
    maxSalary: v?.maxSalary ?? null,
    currency: v?.currency ?? "USD",
    geographicConstraints: (v?.geographicConstraints ?? []).join(", "),
    targetRoles: (a?.targetRoles ?? []).join(", "),
    targetIndustries: (a?.targetIndustries ?? []).join(", "),
    threeYear: a?.threeYear ?? "",
    fiveYear: a?.fiveYear ?? "",
    successDefinition: a?.successDefinition ?? "",
  };
}

const splitTrim = (s: string) =>
  s ? s.split(",").map((x) => x.trim()).filter(Boolean) : undefined;

export function serializeCareerSubmission(value: ReturnType<typeof normalizeCareerDefaults>) {
  return {
    targetRole: value.targetRole || null,
    yearsOfExperience: value.yearsOfExperience,
    values: {
      workEnvironment: value.workEnvironment || undefined,
      riskAppetite: value.riskAppetite || undefined,
      teamSizePreference: value.teamSizePreference || undefined,
      minSalary: value.minSalary ?? undefined,
      maxSalary: value.maxSalary ?? undefined,
      currency: value.currency || undefined,
      geographicConstraints: splitTrim(value.geographicConstraints),
    },
    aspirations: {
      targetRoles: splitTrim(value.targetRoles),
      targetIndustries: splitTrim(value.targetIndustries),
      successDefinition: value.successDefinition || undefined,
      threeYear: value.threeYear || undefined,
      fiveYear: value.fiveYear || undefined,
    },
  };
}
