import prisma from "@kursa/db";
import type { JobApplication } from "@kursa/db";
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
  const application = await prisma.jobApplication.create({
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

  await recordApplicationEvent(userId, application, `Added ${application.roleTitle} at ${application.company}`);
  return application;
}

export async function updateApplication(userId: string, applicationId: string, data: ApplicationUpdateInput) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.jobApplication.findFirst({
    where: { id: applicationId, profileId },
  });
  if (!existing) throw Errors.notFound("Application");

  const application = await prisma.jobApplication.update({
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

  const eventBody = applicationActivityBody(existing, application, data);
  if (eventBody) await recordApplicationEvent(userId, application, eventBody, existing.stage);
  return application;
}

export async function deleteApplication(userId: string, applicationId: string) {
  const profileId = await getProfileId(userId);
  const existing = await prisma.jobApplication.findFirst({
    where: { id: applicationId, profileId },
  });
  if (!existing) throw Errors.notFound("Application");

  await prisma.jobApplication.delete({ where: { id: applicationId } });
}

function applicationActivityBody(
  previous: JobApplication,
  current: JobApplication,
  data: ApplicationUpdateInput,
): string | null {
  const role = current.roleTitle;
  const company = current.company;

  if (data.status !== undefined && current.status !== previous.status && ["closed", "passed"].includes(current.status)) {
    return `Closed ${role} at ${company} as ${current.status}`;
  }

  if (data.stage !== undefined && current.stage !== previous.stage) {
    return `Moved ${role} at ${company} to ${current.stage.replace(/_/g, " ")}`;
  }

  return null;
}

async function recordApplicationEvent(
  userId: string,
  application: JobApplication,
  body: string,
  previousStage?: string,
): Promise<void> {
  const { ingestEvent } = await import("./events.service.js");
  await ingestEvent(userId, {
    type: "application_update",
    source: "system",
    body,
    structured: {
      applicationId: application.id,
      company: application.company,
      roleTitle: application.roleTitle,
      previousStage,
      newStage: application.stage,
      status: application.status,
      updatedAt: new Date().toISOString(),
    },
    skipDelta: true,
    skipDistill: true,
    skipEnrich: true,
  });
}
