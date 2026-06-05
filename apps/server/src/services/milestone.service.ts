import prisma from "@kursa/db";
import type { EventEnrichment } from "@kursa/types";
import type { JourneyMilestone, MilestoneStatus } from "@kursa/types";

const EVIDENCE_TO_COMPLETE = 3;
const EVIDENCE_TO_IN_PROGRESS = 1;

export async function updateMilestonesFromEnrichment(
  userId: string,
  pathId: string,
  enrichment: EventEnrichment,
): Promise<void> {
  if (enrichment.linkedMilestoneOrders.length === 0) return;

  const path = await prisma.careerPath.findFirst({
    where: { id: pathId, profile: { userId } },
  });
  if (!path) return;

  const milestones = path.milestones as unknown as JourneyMilestone[];
  const evidenceCounts = new Map<number, number>();

  const linkedEvents = await prisma.careerEvent.findMany({
    where: {
      userId,
      linkedPathId: pathId,
      deletedAt: null,
    },
    select: { enrichment: true },
  });

  for (const event of linkedEvents) {
    const e = event.enrichment as EventEnrichment | null;
    for (const order of e?.linkedMilestoneOrders ?? []) {
      evidenceCounts.set(order, (evidenceCounts.get(order) ?? 0) + 1);
    }
  }

  for (const order of enrichment.linkedMilestoneOrders) {
    evidenceCounts.set(order, (evidenceCounts.get(order) ?? 0) + 1);
  }

  let changed = false;
  const updated = milestones.map((m) => {
    const count = evidenceCounts.get(m.order) ?? 0;
    let status: MilestoneStatus = m.status;

    if (m.manuallySet) return m;

    if (count >= EVIDENCE_TO_COMPLETE) {
      status = "completed";
    } else if (count >= EVIDENCE_TO_IN_PROGRESS && status === "not_started") {
      status = "in_progress";
    }

    if (status !== m.status) changed = true;
    return { ...m, status };
  });

  if (changed) {
    await prisma.careerPath.update({
      where: { id: pathId },
      data: { milestones: updated as never },
    });
  }
}

export async function getMilestoneEvidenceForUser(userId: string): Promise<
  Array<{
    order: number;
    title: string;
    status: MilestoneStatus;
    eventCount: number;
    recentEventIds: string[];
  }>
> {
  const path = await prisma.careerPath.findFirst({
    where: { profile: { userId }, isActive: true },
  });
  if (!path) return [];

  const milestones = path.milestones as unknown as JourneyMilestone[];
  const events = await prisma.careerEvent.findMany({
    where: { userId, linkedPathId: path.id, deletedAt: null },
    orderBy: { occurredAt: "desc" },
    take: 100,
    select: { id: true, enrichment: true, occurredAt: true },
  });

  return milestones.map((m) => {
    const linked = events.filter((e) => {
      const en = e.enrichment as EventEnrichment | null;
      return en?.linkedMilestoneOrders?.includes(m.order);
    });
    return {
      order: m.order,
      title: m.title,
      status: m.status,
      eventCount: linked.length,
      recentEventIds: linked.slice(0, 5).map((e) => e.id),
    };
  });
}
