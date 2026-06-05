import type {
  UserWorkHistory,
  UserProject,
  UserAchievement,
  UserEducation,
  UserLanguage,
  WorkHistoryCreateInput,
  ProjectCreateInput,
  AchievementCreateInput,
  EducationCreateInput,
  LanguageCreateInput,
} from "@kursa/types";

export function outcomesToText(outcomes: unknown | null): string {
  if (outcomes == null) return "";
  if (typeof outcomes === "object" && outcomes !== null && "text" in outcomes) {
    const text = (outcomes as { text?: unknown }).text;
    return typeof text === "string" ? text : "";
  }
  if (typeof outcomes === "string") return outcomes;
  return "";
}

export function dateToYear(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return String(date.getFullYear());
}

export function toWorkHistoryInput(item: UserWorkHistory): WorkHistoryCreateInput {
  return {
    companyName: item.companyName,
    roleTitle: item.roleTitle,
    outcomes: outcomesToText(item.outcomes),
    startDate: dateToYear(item.startDate) ?? "",
    endDate: dateToYear(item.endDate),
    isCurrent: item.isCurrent,
  };
}

export function toProjectInput(item: UserProject): ProjectCreateInput {
  return {
    title: item.title,
    description: item.description,
    url: item.url,
    outcomes: outcomesToText(item.outcomes),
    startDate: dateToYear(item.startDate),
    endDate: dateToYear(item.endDate),
  };
}

export function toAchievementInput(item: UserAchievement): AchievementCreateInput {
  return {
    type: item.type as AchievementCreateInput["type"],
    title: item.title,
    issuer: item.issuer,
    description: item.description,
    url: item.url,
    dateAchieved: dateToYear(item.dateAchieved),
  };
}

export function toEducationInput(item: UserEducation): EducationCreateInput {
  return {
    type: item.type as EducationCreateInput["type"],
    credentialName: item.credentialName,
    issuer: item.issuer,
    completionDate: dateToYear(item.completionDate),
  };
}

export function toLanguageInput(item: UserLanguage): LanguageCreateInput {
  return {
    name: item.name,
    proficiency: item.proficiency as LanguageCreateInput["proficiency"],
  };
}
