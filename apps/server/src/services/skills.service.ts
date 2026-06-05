import prisma from "@kursa/db";
import type {
  SkillCreateInput,
  SkillProposalSummary,
  SkillSummary,
  SkillUpdateInput,
} from "@kursa/types";

import { isSkillStale } from "../compute/skills-intelligence.compute.js";
import { Errors } from "../errors/http-error.js";
import { normalizeSkillName } from "../lib/skill-normalize.js";

async function requireProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw Errors.notFound("Profile");
  return profile;
}

function mapSkill(row: {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: string | null;
  confidenceRating: number | null;
  lastUsedDate: Date | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SkillSummary {
  return {
    id: row.id,
    name: row.name,
    category: row.category as SkillSummary["category"],
    proficiencyLevel: row.proficiencyLevel as SkillSummary["proficiencyLevel"],
    confidenceRating: row.confidenceRating,
    lastUsedDate: row.lastUsedDate?.toISOString() ?? null,
    source: row.source as SkillSummary["source"],
    isStale: isSkillStale(row.lastUsedDate),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapProposal(row: {
  id: string;
  canonicalName: string;
  displayName: string;
  category: string;
  proposalType: string;
  suggestedConfidence: number | null;
  evidence: string;
  source: string;
  status: string;
  createdAt: Date;
}): SkillProposalSummary {
  return {
    id: row.id,
    canonicalName: row.canonicalName,
    displayName: row.displayName,
    category: row.category as SkillProposalSummary["category"],
    proposalType: row.proposalType as SkillProposalSummary["proposalType"],
    suggestedConfidence: row.suggestedConfidence,
    evidence: row.evidence,
    source: row.source as SkillProposalSummary["source"],
    status: row.status as SkillProposalSummary["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapProposalSourceToSkillSource(
  source: "chat" | "market" | "path" | "journal" | "github",
): "inferred_chat" | "market" | "path" | "inferred_journal" | "github_import" {
  if (source === "chat") return "inferred_chat";
  if (source === "journal") return "inferred_journal";
  if (source === "github") return "github_import";
  return source;
}

export async function listSkills(userId: string): Promise<SkillSummary[]> {
  const profile = await requireProfile(userId);
  const rows = await prisma.skill.findMany({
    where: { profileId: profile.id },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map(mapSkill);
}

export async function createSkill(userId: string, input: SkillCreateInput): Promise<SkillSummary> {
  const profile = await requireProfile(userId);
  const name = normalizeSkillName(input.name);

  const existing = await prisma.skill.findFirst({
    where: { profileId: profile.id, name: { equals: name, mode: "insensitive" } },
  });
  if (existing) throw Errors.badRequest("Skill already exists");

  const row = await prisma.skill.create({
    data: {
      profileId: profile.id,
      name,
      category: input.category,
      confidenceRating: input.confidenceRating ?? 3,
      proficiencyLevel: input.proficiencyLevel ?? null,
      source: input.source ?? "user_edited",
    },
  });
  return mapSkill(row);
}

export async function updateSkill(
  userId: string,
  skillId: string,
  input: SkillUpdateInput,
): Promise<SkillSummary> {
  const profile = await requireProfile(userId);
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, profileId: profile.id },
  });
  if (!skill) throw Errors.notFound("Skill");

  const row = await prisma.skill.update({
    where: { id: skillId },
    data: {
      ...(input.name ? { name: normalizeSkillName(input.name) } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.confidenceRating !== undefined ? { confidenceRating: input.confidenceRating } : {}),
      ...(input.proficiencyLevel !== undefined ? { proficiencyLevel: input.proficiencyLevel } : {}),
      ...(input.lastUsedDate !== undefined
        ? { lastUsedDate: input.lastUsedDate ? new Date(input.lastUsedDate) : null }
        : {}),
      source: "user_edited",
    },
  });
  return mapSkill(row);
}

export async function deleteSkill(userId: string, skillId: string): Promise<void> {
  const profile = await requireProfile(userId);
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, profileId: profile.id },
  });
  if (!skill) throw Errors.notFound("Skill");
  await prisma.skill.delete({ where: { id: skillId } });
}

export async function listSkillProposals(
  userId: string,
  status: "pending" | "accepted" | "dismissed" = "pending",
  limit = 20,
): Promise<{ data: SkillProposalSummary[]; total: number }> {
  const profile = await requireProfile(userId);
  const where = { profileId: profile.id, status };

  const [rows, total] = await Promise.all([
    prisma.skillProposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.skillProposal.count({ where }),
  ]);

  return { data: rows.map(mapProposal), total };
}

export async function acceptSkillProposal(userId: string, proposalId: string): Promise<SkillSummary | null> {
  const profile = await requireProfile(userId);
  const proposal = await prisma.skillProposal.findFirst({
    where: { id: proposalId, profileId: profile.id, status: "pending" },
  });
  if (!proposal) throw Errors.notFound("Skill proposal");

  let skill: SkillSummary | null = null;

  if (proposal.proposalType === "add" || proposal.proposalType === "mark_learning") {
    const existing = await prisma.skill.findFirst({
      where: {
        profileId: profile.id,
        name: { equals: proposal.canonicalName, mode: "insensitive" },
      },
    });

    if (existing) {
      const updated = await prisma.skill.update({
        where: { id: existing.id },
        data: {
          confidenceRating: Math.max(
            existing.confidenceRating ?? 3,
            proposal.suggestedConfidence ?? 3,
          ),
          lastUsedDate: new Date(),
          source: mapProposalSourceToSkillSource(proposal.source),
        },
      });
      skill = mapSkill(updated);
    } else {
      const created = await prisma.skill.create({
        data: {
          profileId: profile.id,
          name: proposal.canonicalName,
          category: proposal.category,
          confidenceRating: proposal.suggestedConfidence ?? 3,
          proficiencyLevel: proposal.suggestedProficiency,
          source: mapProposalSourceToSkillSource(proposal.source),
          lastUsedDate: new Date(),
        },
      });
      skill = mapSkill(created);
    }
  } else if (proposal.proposalType === "update_confidence") {
    const existing = await prisma.skill.findFirst({
      where: {
        profileId: profile.id,
        name: { equals: proposal.canonicalName, mode: "insensitive" },
      },
    });
    if (existing) {
      const updated = await prisma.skill.update({
        where: { id: existing.id },
        data: {
          confidenceRating: proposal.suggestedConfidence ?? existing.confidenceRating,
          lastUsedDate: new Date(),
        },
      });
      skill = mapSkill(updated);
    }
  }

  await prisma.skillProposal.update({
    where: { id: proposalId },
    data: { status: "accepted" },
  });

  return skill;
}

export async function dismissSkillProposal(userId: string, proposalId: string): Promise<void> {
  const profile = await requireProfile(userId);
  const proposal = await prisma.skillProposal.findFirst({
    where: { id: proposalId, profileId: profile.id, status: "pending" },
  });
  if (!proposal) throw Errors.notFound("Skill proposal");

  await prisma.skillProposal.update({
    where: { id: proposalId },
    data: { status: "dismissed" },
  });
}

export async function countPendingProposals(userId: string): Promise<number> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return 0;
  return prisma.skillProposal.count({
    where: { profileId: profile.id, status: "pending" },
  });
}

export type CreateSkillProposalInput = {
  canonicalName: string;
  displayName: string;
  category: "technical" | "soft" | "tool";
  proposalType: "add" | "update_confidence" | "mark_learning" | "mark_stale";
  suggestedConfidence?: number;
  suggestedProficiency?: "beginner" | "intermediate" | "advanced" | "expert";
  source: "chat" | "market" | "path" | "journal" | "github";
  sourceRef?: Record<string, unknown>;
  evidence: string;
};

export async function upsertSkillProposal(
  userId: string,
  input: CreateSkillProposalInput,
): Promise<SkillProposalSummary | null> {
  const profile = await requireProfile(userId);
  const canonicalName = normalizeSkillName(input.canonicalName);
  const expiresAt = new Date(Date.now() + 30 * 86400000);

  const existingSkill = await prisma.skill.findFirst({
    where: { profileId: profile.id, name: { equals: canonicalName, mode: "insensitive" } },
  });

  if (input.proposalType === "add" && existingSkill) {
    return null;
  }

  const pending = await prisma.skillProposal.findFirst({
    where: {
      profileId: profile.id,
      canonicalName,
      proposalType: input.proposalType,
      status: "pending",
    },
  });

  if (pending) {
    const updated = await prisma.skillProposal.update({
      where: { id: pending.id },
      data: {
        evidence: input.evidence,
        displayName: input.displayName,
        suggestedConfidence: input.suggestedConfidence,
        sourceRef: input.sourceRef as object | undefined,
        expiresAt,
      },
    });
    return mapProposal(updated);
  }

  const pendingCount = await prisma.skillProposal.count({
    where: { profileId: profile.id, status: "pending", canonicalName },
  });
  if (pendingCount >= 5) return null;

  const row = await prisma.skillProposal.create({
    data: {
      profileId: profile.id,
      userId,
      canonicalName,
      displayName: input.displayName,
      category: input.category,
      proposalType: input.proposalType,
      suggestedConfidence: input.suggestedConfidence,
      suggestedProficiency: input.suggestedProficiency,
      source: input.source,
      sourceRef: input.sourceRef as object | undefined,
      evidence: input.evidence,
      expiresAt,
    },
  });

  return mapProposal(row);
}
