import prisma, { Prisma } from "@kursa/db";

import type {
  ProfileUpdateInput,
  SocialLinkCreateInput,
  SocialLinkUpdateInput,
  SkillCreateInput,
  SkillUpdateInput,
  LearningGoalCreateInput,
  LearningGoalUpdateInput,
  WorkHistoryCreateInput,
  WorkHistoryUpdateInput,
  ProjectCreateInput,
  ProjectUpdateInput,
  AchievementCreateInput,
  AchievementUpdateInput,
  EducationCreateInput,
  EducationUpdateInput,
  LanguageCreateInput,
  LanguageUpdateInput,
} from "@kursa/types";
import { Errors } from "../errors/http-error.js";
import { yearToDate } from "../lib/year-to-date.js";

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

async function getProfileId(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw Errors.notFound("Profile");
  return profile.id;
}

const PROFILE_INCLUDE: Prisma.ProfileInclude = {
  skills: true,
  workHistories: true,
  educations: true,
  achievements: true,
  projects: true,
  languages: true,
  workAuthorizations: true,
  constraints: true,
  learningGoals: { orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }] },
  socialLinks: true,
  jobApplications: true,
};

/**
 * Returns the full profile for a given user, or null if none exists yet.
 */
export async function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });
}

/**
 * Creates or updates the profile for a given user.
 * Returns the updated profile (without nested relations — caller can re-fetch if needed).
 */
export async function upsertProfile(userId: string, data: ProfileUpdateInput): Promise<Prisma.ProfileGetPayload<{}>> {
  const updateData = {
    ...data,
    aspirations: data.aspirations === null ? Prisma.JsonNull : (data.aspirations as Prisma.InputJsonObject | undefined),
    values: data.values === null ? Prisma.JsonNull : (data.values as Prisma.InputJsonObject | undefined),
  };

  return prisma.profile.upsert({
    where: { userId },
    update: updateData,
    create: { userId, ...updateData },
  });
}


/**
 * Marks the first-run dashboard guide as completed for the user's account.
 */
export async function dismissDashboardGuide(userId: string): Promise<Date> {
  const profileId = await getProfileId(userId);
  const completedAt = new Date();

  await prisma.profile.update({
    where: { id: profileId },
    data: { dashboardGuideCompletedAt: completedAt },
  });

  return completedAt;
}

/**
 * Creates a social link for a user's profile.
 */
export async function createSocialLink(userId: string, data: SocialLinkCreateInput) {
  const profileId = await getProfileId(userId);
  return prisma.socialLink.create({ data: { profileId, ...data } });
}

/**
 * Updates a social link belonging to a user's profile.
 */
export async function updateSocialLink(userId: string, linkId: string, data: SocialLinkUpdateInput) {
  const profileId = await getProfileId(userId);
  const link = await prisma.socialLink.findFirst({ where: { id: linkId, profileId } });
  if (!link) throw Errors.notFound("Social link");
  return prisma.socialLink.update({ where: { id: linkId }, data });
}

/**
 * Deletes a social link belonging to a user's profile.
 */
export async function deleteSocialLink(userId: string, linkId: string) {
  const profileId = await getProfileId(userId);
  const link = await prisma.socialLink.findFirst({ where: { id: linkId, profileId } });
  if (!link) throw Errors.notFound("Social link");
  return prisma.socialLink.delete({ where: { id: linkId } });
}

// ── Skill inventory CRUD (per-skill, ownership-scoped) ──────────────────────────

export async function createSkill(userId: string, data: SkillCreateInput) {
  const profileId = await getProfileId(userId);
  try {
    return await prisma.skill.create({
      data: {
        profileId,
        name: data.name,
        category: data.category,
        confidenceRating: data.confidenceRating,
        proficiencyLevel: data.proficiencyLevel ?? null,
        source: "self_reported",
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw Errors.conflict(`Skill "${data.name}" already exists`);
    throw err;
  }
}

export async function updateSkill(userId: string, skillId: string, data: SkillUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.skill.findFirst({ where: { id: skillId, profileId } });
  if (!existing) throw Errors.notFound("Skill");
  try {
    return await prisma.skill.update({ where: { id: skillId }, data });
  } catch (err) {
    if (isUniqueViolation(err)) throw Errors.conflict(`Skill "${data.name}" already exists`);
    throw err;
  }
}

export async function deleteSkill(userId: string, skillId: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.skill.findFirst({ where: { id: skillId, profileId } });
  if (!existing) throw Errors.notFound("Skill");
  return prisma.skill.delete({ where: { id: skillId } });
}

// ── Learning goal CRUD (the "being built" set) ──────────────────────────────────

export async function createLearningGoal(userId: string, data: LearningGoalCreateInput) {
  const profileId = await getProfileId(userId);
  const status = data.status ?? "PLANNED";
  const existing = await prisma.learningGoal.findFirst({
    where: {
      profileId,
      skillName: { equals: data.skillName, mode: "insensitive" },
    },
  });

  if (existing) return existing;

  const position =
    data.position ??
    (await prisma.learningGoal.count({
      where: { profileId, status },
    }));

  return prisma.learningGoal.create({
    data: {
      profileId,
      skillName: data.skillName,
      targetProficiency: data.targetProficiency ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      status,
      position,
    },
  });
}

export async function updateLearningGoal(
  userId: string,
  goalId: string,
  data: LearningGoalUpdateInput,
) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.learningGoal.findFirst({ where: { id: goalId, profileId } });
  if (!existing) throw Errors.notFound("Learning goal");
  const { deadline, ...rest } = data;
  const updateData: Prisma.LearningGoalUpdateInput = { ...rest };
  if (deadline !== undefined) {
    updateData.deadline = deadline ? new Date(deadline) : null;
  }
  return prisma.learningGoal.update({ where: { id: goalId }, data: updateData });
}

export async function deleteLearningGoal(userId: string, goalId: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.learningGoal.findFirst({ where: { id: goalId, profileId } });
  if (!existing) throw Errors.notFound("Learning goal");
  return prisma.learningGoal.delete({ where: { id: goalId } });
}

// ── Work history CRUD ─────────────────────────────────────────────────────────

export async function createWorkHistory(userId: string, data: WorkHistoryCreateInput) {
  const profileId = await getProfileId(userId);
  const startDate = yearToDate(data.startDate);
  if (!startDate) throw Errors.badRequest("Work history start year is required");
  return prisma.workHistory.create({
    data: {
      profileId,
      companyName: data.companyName.trim(),
      roleTitle: data.roleTitle.trim(),
      startDate,
      endDate: yearToDate(data.endDate),
      isCurrent: data.isCurrent,
      outcomes: { text: data.outcomes.trim() } as never,
    },
  });
}

export async function updateWorkHistory(userId: string, id: string, data: WorkHistoryUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.workHistory.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Work history");
  const updateData: Prisma.WorkHistoryUpdateInput = {};
  if (data.companyName !== undefined) updateData.companyName = data.companyName.trim();
  if (data.roleTitle !== undefined) updateData.roleTitle = data.roleTitle.trim();
  if (data.outcomes !== undefined) updateData.outcomes = { text: data.outcomes.trim() } as never;
  if (data.startDate !== undefined) {
    const startDate = yearToDate(data.startDate);
    if (!startDate) throw Errors.badRequest("Work history start year is required");
    updateData.startDate = startDate;
  }
  if (data.endDate !== undefined) updateData.endDate = yearToDate(data.endDate);
  if (data.isCurrent !== undefined) updateData.isCurrent = data.isCurrent;
  return prisma.workHistory.update({ where: { id }, data: updateData });
}

export async function deleteWorkHistory(userId: string, id: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.workHistory.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Work history");
  return prisma.workHistory.delete({ where: { id } });
}

// ── Project CRUD ──────────────────────────────────────────────────────────────

export async function createProject(userId: string, data: ProjectCreateInput) {
  const profileId = await getProfileId(userId);
  return prisma.project.create({
    data: {
      profileId,
      title: data.title.trim(),
      description: data.description,
      url: data.url,
      startDate: yearToDate(data.startDate),
      endDate: yearToDate(data.endDate),
      outcomes: { text: data.outcomes.trim() } as never,
    },
  });
}

export async function updateProject(userId: string, id: string, data: ProjectUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.project.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Project");
  const updateData: Prisma.ProjectUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.outcomes !== undefined) updateData.outcomes = { text: data.outcomes.trim() } as never;
  if (data.startDate !== undefined) updateData.startDate = yearToDate(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = yearToDate(data.endDate);
  return prisma.project.update({ where: { id }, data: updateData });
}

export async function deleteProject(userId: string, id: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.project.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Project");
  return prisma.project.delete({ where: { id } });
}

// ── Achievement CRUD ──────────────────────────────────────────────────────────

export async function createAchievement(userId: string, data: AchievementCreateInput) {
  const profileId = await getProfileId(userId);
  return prisma.achievement.create({
    data: {
      profileId,
      type: data.type,
      title: data.title.trim(),
      issuer: data.issuer,
      description: data.description,
      url: data.url,
      dateAchieved: yearToDate(data.dateAchieved),
    },
  });
}

export async function updateAchievement(userId: string, id: string, data: AchievementUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.achievement.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Achievement");
  const updateData: Prisma.AchievementUpdateInput = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.issuer !== undefined) updateData.issuer = data.issuer;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.dateAchieved !== undefined) updateData.dateAchieved = yearToDate(data.dateAchieved);
  return prisma.achievement.update({ where: { id }, data: updateData });
}

export async function deleteAchievement(userId: string, id: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.achievement.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Achievement");
  return prisma.achievement.delete({ where: { id } });
}

// ── Education CRUD ────────────────────────────────────────────────────────────

export async function createEducation(userId: string, data: EducationCreateInput) {
  const profileId = await getProfileId(userId);
  return prisma.education.create({
    data: {
      profileId,
      type: data.type,
      credentialName: data.credentialName.trim(),
      issuer: data.issuer.trim(),
      completionDate: yearToDate(data.completionDate),
    },
  });
}

export async function updateEducation(userId: string, id: string, data: EducationUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.education.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Education");
  const updateData: Prisma.EducationUpdateInput = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.credentialName !== undefined) updateData.credentialName = data.credentialName.trim();
  if (data.issuer !== undefined) updateData.issuer = data.issuer.trim();
  if (data.completionDate !== undefined) updateData.completionDate = yearToDate(data.completionDate);
  return prisma.education.update({ where: { id }, data: updateData });
}

export async function deleteEducation(userId: string, id: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.education.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Education");
  return prisma.education.delete({ where: { id } });
}

// ── Language CRUD ─────────────────────────────────────────────────────────────

export async function createLanguage(userId: string, data: LanguageCreateInput) {
  const profileId = await getProfileId(userId);
  return prisma.language.create({
    data: {
      profileId,
      name: data.name.trim(),
      proficiency: data.proficiency,
    },
  });
}

export async function updateLanguage(userId: string, id: string, data: LanguageUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.language.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Language");
  const updateData: Prisma.LanguageUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.proficiency !== undefined) updateData.proficiency = data.proficiency;
  return prisma.language.update({ where: { id }, data: updateData });
}

export async function deleteLanguage(userId: string, id: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.language.findFirst({ where: { id, profileId } });
  if (!existing) throw Errors.notFound("Language");
  return prisma.language.delete({ where: { id } });
}
