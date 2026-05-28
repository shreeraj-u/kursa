import prisma, { Prisma } from "@kursa/db";

import type { ProfileUpdateInput, SocialLinkCreateInput, SocialLinkUpdateInput } from "../validators/profile.validator.js";
import { Errors } from "../errors/http-error.js";

const PROFILE_INCLUDE = {
  skills: true,
  workHistories: true,
  educations: true,
  achievements: true,
  projects: true,
  languages: true,
  workAuthorizations: true,
  constraints: true,
  learningGoals: true,
  socialLinks: true,
  jobApplications: true,
} as const;

/**
 * Returns the full profile for a given user, or null if none exists yet.
 */
export async function getProfile(userId: string): Promise<Prisma.ProfileGetPayload<{ include: typeof PROFILE_INCLUDE }> | null> {
  return prisma.profile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });
}

/**
 * Creates or updates the profile for a given user.
 * Returns the updated profile (without nested relations — caller can re-fetch if needed).
 */
export async function upsertProfile(userId: string, data: ProfileUpdateInput) {
  const updateData = {
    ...data,
    aspirations: data.aspirations === null ? Prisma.JsonNull : data.aspirations,
    values: data.values === null ? Prisma.JsonNull : data.values,
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
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw Errors.notFound("Profile");
  return prisma.socialLink.create({ data: { profileId: profile.id, ...data } });
}

/**
 * Updates a social link belonging to a user's profile.
 */
export async function updateSocialLink(userId: string, linkId: string, data: SocialLinkUpdateInput) {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw Errors.notFound("Profile");
  const link = await prisma.socialLink.findFirst({ where: { id: linkId, profileId: profile.id } });
  if (!link) throw Errors.notFound("Social link");
  return prisma.socialLink.update({ where: { id: linkId }, data });
}

/**
 * Deletes a social link belonging to a user's profile.
 */
export async function deleteSocialLink(userId: string, linkId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw Errors.notFound("Profile");
  const link = await prisma.socialLink.findFirst({ where: { id: linkId, profileId: profile.id } });
  if (!link) throw Errors.notFound("Social link");
  return prisma.socialLink.delete({ where: { id: linkId } });
}
