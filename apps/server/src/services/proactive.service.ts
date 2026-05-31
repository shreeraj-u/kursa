import prisma from "@kursa/db";
import type { ProactiveNudge } from "@kursa/types";

import { assembleAdvisorContext } from "../lib/advisor-context.js";
import { shouldRegeneratePaths } from "../compute/advisor.compute.js";
import { getMilestoneEvidenceForUser } from "./milestone.service.js";
import { ingestEvent } from "./career-event-intelligence/index.js";
import { getNextCheckIn } from "./checkins.service.js";

export async function getProactiveNudges(userId: string): Promise<ProactiveNudge[]> {
  const context = await assembleAdvisorContext(userId, "journal");
  if (!context) return [];

  const nudges: ProactiveNudge[] = [];

  if (shouldRegeneratePaths(context.signals)) {
    nudges.push({
      id: "path-regen",
      type: "path_regen",
      title: "Profile shifted",
      message: "Your recent activity suggests your career path may need updating.",
      actionLabel: "Regenerate paths",
      actionHref: "/dashboard/career-path",
      priority: "high",
    });
  }

  if (
    context.signals.sentimentTrend12w !== null &&
    context.signals.sentimentTrend12w < -0.3
  ) {
    nudges.push({
      id: "sentiment-alert",
      type: "sentiment_alert",
      title: "Engagement dipping",
      message: "Your check-in and journal sentiment has been lower than usual over the past few weeks.",
      actionLabel: "Log a pulse",
      priority: "medium",
    });
  }

  const milestoneEvidence = await getMilestoneEvidenceForUser(userId);
  const nearComplete = milestoneEvidence.find(
    (m) => m.status === "in_progress" && m.eventCount >= 1 && m.eventCount < 3,
  );
  if (nearComplete) {
    nudges.push({
      id: `milestone-${nearComplete.order}`,
      type: "milestone_gap",
      title: "Milestone progress",
      message: `You're building evidence for "${nearComplete.title}" — ${3 - nearComplete.eventCount} more wins could complete it.`,
      priority: "medium",
    });
  }

  const checkIn = await getNextCheckIn(userId);
  if (checkIn.due) {
    nudges.push({
      id: "checkin-reminder",
      type: "checkin_reminder",
      title: checkIn.type === "checkin_monthly" ? "Monthly review due" : "Weekly pulse due",
      message: "A quick check-in helps Aria track your momentum.",
      actionLabel: "Complete check-in",
      priority: "medium",
    });
  }

  const quarterAgo = new Date(Date.now() - 86400000 * 90);
  const winsSinceReview = await prisma.careerEvent.count({
    where: {
      userId,
      type: "win",
      deletedAt: null,
      occurredAt: { gte: quarterAgo },
    },
  });

  if (winsSinceReview >= 3) {
    nudges.push({
      id: "review-prep",
      type: "review_prep",
      title: "Review prep ready",
      message: `You have ${winsSinceReview} accomplishments this quarter — great time to draft review bullets.`,
      actionLabel: "Open review prep",
      priority: "low",
    });
  }

  return nudges;
}

export async function recordProactiveNudgeDelivered(
  userId: string,
  nudge: ProactiveNudge,
): Promise<void> {
  await ingestEvent(userId, {
    type: "system",
    source: "system",
    body: nudge.message,
    structured: { nudgeType: nudge.type, nudgeId: nudge.id },
    skipDelta: true,
    skipDistill: true,
    skipEnrich: true,
  });
}

export async function runCheckInReminderScan(): Promise<void> {
  const profiles = await prisma.profile.findMany({
    where: { onboardingDone: true },
    select: { userId: true },
    take: 500,
  });

  for (const { userId } of profiles) {
    try {
      const checkIn = await getNextCheckIn(userId);
      if (checkIn.due) {
        await recordProactiveNudgeDelivered(userId, {
          id: "checkin-reminder-job",
          type: "checkin_reminder",
          title: "Check-in due",
          message: "Your career pulse check-in is due.",
          priority: "medium",
        });
      }
    } catch (err) {
      console.error("[proactive] reminder scan failed for", userId, err);
    }
  }
}
