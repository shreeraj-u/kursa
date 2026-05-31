import prisma from "@kursa/db";
import type { MemoryCandidate, UserMemorySummary } from "@kursa/types";

import { distillMemories } from "../compute/memory.distill.js";
import { distillMemoriesWithLlm } from "../lib/ai/enrichment.extract.js";

const CONFIDENCE_DECAY_DAYS = 90;
const DECAY_FACTOR = 0.85;

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

  await applyConfidenceDecay(userId, existingMemories);

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

  await upsertMemoryCandidates(userId, candidates, existingMemories);
}

export async function runBatchMemoryDistillation(userId: string, profileId: string): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);

  const [events, profile, existingMemories] = await Promise.all([
    prisma.careerEvent.findMany({
      where: { userId, deletedAt: null, occurredAt: { gte: thirtyDaysAgo } },
      orderBy: { occurredAt: "desc" },
      take: 50,
    }),
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { aspirations: true },
    }),
    prisma.userMemory.findMany({
      where: { userId, validUntil: null },
    }),
  ]);

  if (events.length < 2) return;

  const llmCandidates = await distillMemoriesWithLlm(
    events.map((e) => ({
      id: e.id,
      type: e.type,
      body: e.body,
      occurredAt: e.occurredAt.toISOString(),
    })),
    profile?.aspirations ?? null,
  );

  await upsertMemoryCandidates(
    userId,
    llmCandidates.map((c) => ({
      category: c.category,
      fact: c.fact,
      confidence: c.confidence,
      sourceEntryIds: c.sourceEntryIds,
    })),
    existingMemories,
  );
}

async function applyConfidenceDecay(
  userId: string,
  memories: Array<{ id: string; confidence: number; sourceEntryIds: string[]; updatedAt?: Date }>,
): Promise<void> {
  const cutoff = new Date(Date.now() - CONFIDENCE_DECAY_DAYS * 86400000);

  for (const memory of memories) {
    if (memory.sourceEntryIds.length === 0) continue;

    const recentReinforcement = await prisma.careerEvent.findFirst({
      where: {
        userId,
        id: { in: memory.sourceEntryIds },
        occurredAt: { gte: cutoff },
        deletedAt: null,
      },
    });

    if (!recentReinforcement && memory.confidence > 0.3) {
      await prisma.userMemory.update({
        where: { id: memory.id },
        data: { confidence: Math.max(0.3, memory.confidence * DECAY_FACTOR) },
      });
    }
  }
}

async function upsertMemoryCandidates(
  userId: string,
  candidates: MemoryCandidate[],
  existingMemories: Array<{ id: string; category: string; fact: string; confidence: number; sourceEntryIds: string[] }>,
): Promise<void> {
  for (const candidate of candidates) {
    const duplicate = existingMemories.find(
      (m) => m.category === candidate.category && m.fact === candidate.fact,
    );

    const contradiction = existingMemories.find(
      (m) =>
        m.category === candidate.category &&
        m.fact !== candidate.fact &&
        isContradiction(m.category, m.fact, candidate.fact),
    );

    if (contradiction) {
      const newMemory = await prisma.userMemory.create({
        data: {
          userId,
          category: candidate.category,
          fact: candidate.fact,
          confidence: candidate.confidence,
          sourceEntryIds: candidate.sourceEntryIds,
        },
      });
      await prisma.userMemory.update({
        where: { id: contradiction.id },
        data: { validUntil: new Date(), supersededBy: newMemory.id },
      });
      continue;
    }

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
      const created = await prisma.userMemory.create({
        data: {
          userId,
          category: candidate.category,
          fact: candidate.fact,
          confidence: candidate.confidence,
          sourceEntryIds: candidate.sourceEntryIds,
        },
      });
      existingMemories.push({
        id: created.id,
        category: created.category,
        fact: created.fact,
        confidence: created.confidence,
        sourceEntryIds: created.sourceEntryIds,
      });
    }
  }
}

function isContradiction(category: string, oldFact: string, newFact: string): boolean {
  if (category !== "sentiment_pattern" && category !== "sentiment") return false;
  const oldLow = oldFact.toLowerCase().includes("low") || oldFact.toLowerCase().includes("dissatisfaction");
  const newHigh = newFact.toLowerCase().includes("high") || newFact.toLowerCase().includes("satisfaction");
  return oldLow && newHigh;
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
  const existing = await prisma.userMemory.findMany({
    where: { userId, validUntil: null },
  });
  await upsertMemoryCandidates(userId, candidates, existing);
}
