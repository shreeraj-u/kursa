const ACHIEVEMENT_TYPES = new Set([
  "HACKATHON",
  "AWARD",
  "PUBLICATION",
  "SPEAKING",
  "OPEN_SOURCE",
  "VOLUNTEER",
  "OTHER",
]);

const EDUCATION_TYPES = new Set(["degree", "certification", "course"]);
const SKILL_CATEGORIES = new Set(["technical", "soft", "tool"]);
const LANGUAGE_LEVELS = new Set(["Native", "Fluent", "Conversational", "Basic"]);
const SOCIAL_PLATFORMS = new Set(["github", "linkedin", "twitter", "website", "portfolio"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function coerceString(value: unknown, fallback: string | null = null): string | null {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function coerceConfidence(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, n));
}

function coerceAchievementType(value: unknown): string {
  const normalized = String(value ?? "OTHER").toUpperCase().replace(/[\s-]+/g, "_");
  return ACHIEVEMENT_TYPES.has(normalized) ? normalized : "OTHER";
}

function coerceEducationType(value: unknown): string {
  const normalized = String(value ?? "degree").toLowerCase();
  return EDUCATION_TYPES.has(normalized) ? normalized : "degree";
}

function coerceSkillCategory(value: unknown): string {
  const normalized = String(value ?? "technical").toLowerCase();
  return SKILL_CATEGORIES.has(normalized) ? normalized : "technical";
}

function coerceLanguageLevel(value: unknown): string {
  const raw = String(value ?? "Fluent");
  const match = [...LANGUAGE_LEVELS].find((level) => level.toLowerCase() === raw.toLowerCase());
  return match ?? "Fluent";
}

function coerceSocialPlatform(value: unknown): string {
  const normalized = String(value ?? "website").toLowerCase();
  return SOCIAL_PLATFORMS.has(normalized) ? normalized : "website";
}

function coerceBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "yes" || lower === "current") return true;
    if (lower === "false" || lower === "no") return false;
  }
  return fallback;
}

/** Coerce messy LLM JSON into a shape the strict Zod schema can accept. */
export function normalizeLlmResumePayload(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw) ?? {};

  const skills = (Array.isArray(root.skills) ? root.skills : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const name = coerceString(row.name);
      if (!name) return null;
      return {
        name,
        category: coerceSkillCategory(row.category),
        confidenceRating: coerceConfidence(row.confidenceRating),
      };
    })
    .filter(Boolean);

  const workHistory = (Array.isArray(root.workHistory) ? root.workHistory : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const companyName = coerceString(row.companyName);
      const roleTitle = coerceString(row.roleTitle);
      if (!companyName || !roleTitle) return null;
      return {
        companyName,
        roleTitle,
        outcomes: coerceString(row.outcomes) ?? "",
        startDate: coerceString(row.startDate),
        endDate: coerceString(row.endDate),
        isCurrent: coerceBool(row.isCurrent),
      };
    })
    .filter(Boolean);

  const projects = (Array.isArray(root.projects) ? root.projects : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const title = coerceString(row.title);
      if (!title) return null;
      return {
        title,
        description: coerceString(row.description),
        url: coerceString(row.url),
        outcomes: coerceString(row.outcomes) ?? "",
        startDate: coerceString(row.startDate),
        endDate: coerceString(row.endDate),
      };
    })
    .filter(Boolean);

  const achievements = (Array.isArray(root.achievements) ? root.achievements : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const title = coerceString(row.title);
      if (!title) return null;
      return {
        type: coerceAchievementType(row.type),
        title,
        issuer: coerceString(row.issuer),
        description: coerceString(row.description),
        url: coerceString(row.url),
        dateAchieved: coerceString(row.dateAchieved),
      };
    })
    .filter(Boolean);

  const education = (Array.isArray(root.education) ? root.education : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const credentialName = coerceString(row.credentialName);
      const issuer = coerceString(row.issuer);
      if (!credentialName || !issuer) return null;
      return {
        type: coerceEducationType(row.type),
        credentialName,
        issuer,
        completionDate: coerceString(row.completionDate),
      };
    })
    .filter(Boolean);

  const languages = (Array.isArray(root.languages) ? root.languages : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const name = coerceString(row.name);
      if (!name) return null;
      return {
        name,
        proficiency: coerceLanguageLevel(row.proficiency),
      };
    })
    .filter(Boolean);

  const socialLinks = (Array.isArray(root.socialLinks) ? root.socialLinks : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const url = coerceString(row.url);
      if (!url) return null;
      return {
        platform: coerceSocialPlatform(row.platform),
        url,
      };
    })
    .filter(Boolean);

  const basicsRow = asRecord(root.basics) ?? {};

  return {
    skills,
    workHistory,
    projects,
    achievements,
    education,
    languages,
    socialLinks,
    basics: {
      bio: coerceString(basicsRow.bio),
      location: coerceString(basicsRow.location),
    },
  };
}
