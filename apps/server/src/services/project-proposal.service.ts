import prisma from "@kursa/db";
import type { ProjectProposalSummary } from "@kursa/types";

import { Errors } from "../errors/http-error.js";

async function requireProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw Errors.notFound("Profile");
  return profile;
}

function mapProposal(row: {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  outcomes: unknown;
  startDate: Date | null;
  endDate: Date | null;
  evidence: string;
  source: string;
  sourceRef: unknown;
  status: string;
  createdAt: Date;
}): ProjectProposalSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    outcomes: (row.outcomes as Record<string, unknown> | null) ?? null,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    evidence: row.evidence,
    source: row.source,
    sourceRef: (row.sourceRef as Record<string, unknown> | null) ?? null,
    status: row.status as ProjectProposalSummary["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

export type CreateProjectProposalInput = {
  title: string;
  description?: string | null;
  url?: string | null;
  outcomes?: Record<string, unknown> | null;
  startDate?: Date | null;
  endDate?: Date | null;
  evidence: string;
  sourceRef?: Record<string, unknown>;
};

export async function upsertProjectProposal(
  userId: string,
  input: CreateProjectProposalInput,
): Promise<ProjectProposalSummary | null> {
  const profile = await requireProfile(userId);
  const titleKey = input.title.trim().toLowerCase();
  if (!titleKey) return null;

  const existingProject = await prisma.project.findFirst({
    where: { profileId: profile.id, title: { equals: input.title, mode: "insensitive" } },
  });
  if (existingProject) return null;

  const expiresAt = new Date(Date.now() + 30 * 86400000);

  const pending = await prisma.projectProposal.findFirst({
    where: {
      profileId: profile.id,
      title: { equals: input.title, mode: "insensitive" },
      status: "pending",
    },
  });

  if (pending) {
    const updated = await prisma.projectProposal.update({
      where: { id: pending.id },
      data: {
        description: input.description,
        url: input.url,
        outcomes: input.outcomes as object | undefined,
        startDate: input.startDate,
        endDate: input.endDate,
        evidence: input.evidence,
        sourceRef: input.sourceRef as object | undefined,
        expiresAt,
      },
    });
    return mapProposal(updated);
  }

  const count = await prisma.projectProposal.count({
    where: { profileId: profile.id, status: "pending" },
  });
  if (count >= 30) return null;

  const row = await prisma.projectProposal.create({
    data: {
      profileId: profile.id,
      userId,
      title: input.title.trim(),
      description: input.description,
      url: input.url,
      outcomes: input.outcomes as object | undefined,
      startDate: input.startDate,
      endDate: input.endDate,
      evidence: input.evidence,
      source: "github",
      sourceRef: input.sourceRef as object | undefined,
      expiresAt,
    },
  });
  return mapProposal(row);
}

export async function listProjectProposals(
  userId: string,
  status: "pending" | "accepted" | "dismissed" = "pending",
  limit = 30,
): Promise<{ data: ProjectProposalSummary[]; total: number }> {
  const profile = await requireProfile(userId);
  const where = { profileId: profile.id, status };
  const [rows, total] = await Promise.all([
    prisma.projectProposal.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
    prisma.projectProposal.count({ where }),
  ]);
  return { data: rows.map(mapProposal), total };
}

export async function acceptProjectProposal(userId: string, proposalId: string) {
  const profile = await requireProfile(userId);
  const proposal = await prisma.projectProposal.findFirst({
    where: { id: proposalId, profileId: profile.id, status: "pending" },
  });
  if (!proposal) throw Errors.notFound("Project proposal");

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        profileId: profile.id,
        title: proposal.title,
        description: proposal.description,
        url: proposal.url,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        outcomes: proposal.outcomes ?? undefined,
      },
    });
    await tx.projectProposal.update({
      where: { id: proposalId },
      data: { status: "accepted" },
    });
    return created;
  });

  return {
    id: project.id,
    title: project.title,
    url: project.url,
  };
}

export async function dismissProjectProposal(userId: string, proposalId: string): Promise<void> {
  const profile = await requireProfile(userId);
  const proposal = await prisma.projectProposal.findFirst({
    where: { id: proposalId, profileId: profile.id, status: "pending" },
  });
  if (!proposal) throw Errors.notFound("Project proposal");
  await prisma.projectProposal.update({
    where: { id: proposalId },
    data: { status: "dismissed" },
  });
}

export async function countPendingProjectProposals(userId: string): Promise<number> {
  const profile = await requireProfile(userId);
  return prisma.projectProposal.count({
    where: { profileId: profile.id, status: "pending" },
  });
}
