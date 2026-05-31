import type { UserProfile } from "@kursa/types";

export function normalizeCareerDefaults(profile: UserProfile | null) {
  const v = profile?.values as any;
  const a = profile?.aspirations as any;

  const safeJoin = (val: unknown): string => {
    if (!val) return "";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "string") return val;
    return String(val);
  };

  const parseSalary = (val: unknown): number | null => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const match = val.replace(/,/g, "").match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (val.toLowerCase().includes("k") && num < 1000) {
          return num * 1000;
        }
        return num;
      }
    }
    return null;
  };

  const extractCurrency = (val: unknown): string | undefined => {
    if (typeof val !== "string") return undefined;
    const match = val.toUpperCase().match(/(USD|GBP|EUR|CAD|AUD|SGD|INR)/);
    if (match) return match[0];
    if (val.includes("$")) return "USD";
    if (val.includes("£")) return "GBP";
    if (val.includes("€")) return "EUR";
    return undefined;
  };

  return {
    targetRole: profile?.targetRole ?? "",
    yearsOfExperience: profile?.yearsOfExperience ?? null,
    workEnvironment: v?.workEnvironment ?? v?.layer1Values?.workEnvironment ?? "",
    riskAppetite: v?.riskAppetite ?? v?.layer1Values?.riskAppetite ?? "",
    teamSizePreference: v?.teamSizePreference ?? v?.layer1Values?.teamSizePreference ?? "",
    minSalary: v?.minSalary ?? parseSalary(v?.layer1Values?.salaryExpectation) ?? null,
    maxSalary: v?.maxSalary ?? null,
    currency: v?.currency ?? extractCurrency(v?.layer1Values?.salaryExpectation) ?? "USD",
    geographicConstraints: safeJoin(v?.geographicConstraints ?? v?.layer1Values?.constraints),
    targetRoles: safeJoin(a?.targetRoles),
    targetIndustries: safeJoin(a?.targetIndustries),
    threeYear: a?.threeYear ?? a?.horizon3y ?? "",
    fiveYear: a?.fiveYear ?? a?.horizon5y ?? "",
    successDefinition: a?.successDefinition ?? a?.definitionOfSuccess ?? "",
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
