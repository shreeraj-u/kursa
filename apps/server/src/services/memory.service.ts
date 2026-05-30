import prisma from "@kursa/db";
import type { MemoryCandidate, UserMemorySummary } from "@kursa/types";

import { distillMemories } from "../compute/memory.distill.js";

export async function runMemoryDistillation(userId: string, profileId: string): Promise<void> {
  const sixWeeksAgo = new Date(Date.now() - 86400000 * 42);

  const [recentEvents, existingMemories, profile] = await Promise.all([
    prisma.careerEvent.findMany({
      where: { userId, deletedAt: null, occurredAt: { gte: sixWeeksAgo } },
      orderBy: { occurredAt: "desc" },
      take: 50,
    }),
    prisma.userMemory.findMany({
      where: { userId, validUntil: null },
    }),
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { aspirations: true },
    }),
  ]);

  const candidates = distillMemories(
    recentEvents.map((e) => ({
      id: e.id,
      type: e.type,
      body: e.body,
      structured: e.structured,
      sentiment: e.sentiment,
      occurredAt: e.occurredAt,
    })),
    existingMemories.map((m) => ({
      id: m.id,
      category: m.category,
      fact: m.fact,
      confidence: m.confidence,
    })),
    profile?.aspirations ?? null,
  );

  for (const candidate of candidates) {
    const duplicate = existingMemories.find(
      (m) => m.category === candidate.category && m.fact === candidate.fact,
    );
    if (duplicate) {
      await prisma.userMemory.update({
        where: { id: duplicate.id },
        data: {
          confidence: Math.min(0.99, duplicate.confidence + 0.05),
          sourceEntryIds: [
            ...new Set([...duplicate.sourceEntryIds, ...candidate.sourceEntryIds]),
          ],
        },
      });
    } else {
      await prisma.userMemory.create({
        data: {
          userId,
          category: candidate.category,
          fact: candidate.fact,
          confidence: candidate.confidence,
          sourceEntryIds: candidate.sourceEntryIds,
        },
      });
    }
  }
}

export async function getMemoriesForUser(userId: string, limit = 20): Promise<UserMemorySummary[]> {
  const rows = await prisma.userMemory.findMany({
    where: { userId, validUntil: null },
    orderBy: [{ confidence: "desc" }, { validFrom: "desc" }],
    take: limit,
  });

  return rows.map((m) => ({
    id: m.id,
    category: m.category,
    fact: m.fact,
    confidence: m.confidence,
    validFrom: m.validFrom.toISOString(),
  }));
}

export async function mergeMemoryCandidates(
  userId: string,
  candidates: MemoryCandidate[],
): Promise<void> {
  for (const candidate of candidates) {
    await prisma.userMemory.create({
      data: {
        userId,
        category: candidate.category,
        fact: candidate.fact,
        confidence: candidate.confidence,
        sourceEntryIds: candidate.sourceEntryIds,
      },
    });
  }
}
