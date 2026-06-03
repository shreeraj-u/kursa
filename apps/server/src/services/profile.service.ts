import prisma, { Prisma } from "@kursa/db";

import type {
  ProfileUpdateInput,
  SocialLinkCreateInput,
  SocialLinkUpdateInput,
  SkillCreateInput,
  SkillUpdateInput,
  LearningGoalCreateInput,
  LearningGoalUpdateInput,
} from "@kursa/types";
import { Errors } from "../errors/http-error.js";

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
