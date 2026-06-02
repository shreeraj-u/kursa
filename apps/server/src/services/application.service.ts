import prisma from "@kursa/db";
import { Errors } from "../errors/http-error.js";
import type { ApplicationCreateInput, ApplicationUpdateInput } from "../validators/application.validator.js";

async function getProfileId(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw Errors.notFound("Profile");
  return profile.id;
}

export async function listApplications(userId: string) {
  const profileId = await getProfileId(userId);
  return prisma.jobApplication.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createApplication(userId: string, data: ApplicationCreateInput) {
  const profileId = await getProfileId(userId);
  return prisma.jobApplication.create({
    data: {
      profileId,
      company: data.company,
      roleTitle: data.roleTitle,
      stage: data.stage,
      status: data.status,
      url: data.url ?? null,
      notes: data.notes ?? null,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
      nextAction: data.nextAction ?? null,
      nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null,
    },
  });
}

export async function updateApplication(userId: string, applicationId: string, data: ApplicationUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.jobApplication.findFirst({
    where: { id: applicationId, profileId },
    select: { id: true },
  });
  if (!existing) throw Errors.notFound("Application");

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      ...(data.company !== undefined && { company: data.company }),
      ...(data.roleTitle !== undefined && { roleTitle: data.roleTitle }),
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.appliedAt !== undefined && { appliedAt: data.appliedAt ? new Date(data.appliedAt) : null }),
      ...(data.nextAction !== undefined && { nextAction: data.nextAction }),
      ...(data.nextActionAt !== undefined && { nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null }),
    },
  });
}

export async function deleteApplication(userId: string, applicationId: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.jobApplication.findFirst({
    where: { id: applicationId, profileId },
    select: { id: true },
  });
  if (!existing) throw Errors.notFound("Application");

  await prisma.jobApplication.delete({ where: { id: applicationId } });
}
