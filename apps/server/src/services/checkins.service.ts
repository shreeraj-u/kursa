import prisma from "@kursa/db";
import type { CheckInNextResponse, SubmitCheckInInput } from "@kursa/types";

import { ingestEvent } from "./events.service.js";

const WEEKLY_QUESTIONS: CheckInNextResponse["questions"] = [
  { id: "energyFocus", label: "What took most of your energy this week?", kind: "text" },
  { id: "challengeLevel", label: "How challenged do you feel in your current role?", kind: "scale" },
  { id: "rememberThis", label: "Anything you want Aria to remember? (optional)", kind: "text" },
];

const MONTHLY_QUESTIONS: CheckInNextResponse["questions"] = [
  { id: "satisfaction", label: "Overall satisfaction with your role", kind: "scale" },
  { id: "growth", label: "Growth and learning this month", kind: "scale" },
  { id: "management", label: "Relationship with your manager", kind: "scale" },
  { id: "valuesAlignment", label: "Alignment with your values", kind: "scale" },
  { id: "blockers", label: "Biggest blockers right now", kind: "text" },
  { id: "winsSinceLast", label: "Wins since your last review", kind: "text" },
];

export async function getNextCheckIn(userId: string): Promise<CheckInNextResponse> {
  const now = new Date();
  const weekStart = startOfWeek(now);

  const [lastWeekly, lastMonthly] = await Promise.all([
    prisma.careerEvent.findFirst({
      where: { userId, type: "checkin_weekly", deletedAt: null },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.careerEvent.findFirst({
      where: { userId, type: "checkin_monthly", deletedAt: null },
      orderBy: { occurredAt: "desc" },
    }),
  ]);

  const monthlyDue =
    !lastMonthly || now.getTime() - lastMonthly.occurredAt.getTime() > 86400000 * 28;

  if (monthlyDue && (!lastMonthly || now.getDate() <= 7)) {
    return {
      due: true,
      type: "checkin_monthly",
      questions: MONTHLY_QUESTIONS,
      lastCompletedAt: lastMonthly?.occurredAt.toISOString() ?? null,
    };
  }

  const weeklyDue =
    !lastWeekly || lastWeekly.occurredAt.getTime() < weekStart.getTime();

  return {
    due: weeklyDue,
    type: weeklyDue ? "checkin_weekly" : null,
    questions: WEEKLY_QUESTIONS,
    lastCompletedAt: lastWeekly?.occurredAt.toISOString() ?? null,
  };
}

export async function submitCheckIn(userId: string, input: SubmitCheckInInput) {
  const body =
    input.type === "checkin_weekly"
      ? summarizeWeekly(input.responses as unknown as Record<string, unknown>)
      : summarizeMonthly(input.responses as unknown as Record<string, unknown>);

  return ingestEvent(userId, {
    type: input.type,
    source: "user",
    body,
    structured: input.responses,
  });
}

export async function getCheckInHistory(userId: string, limit = 20) {
  const rows = await prisma.careerEvent.findMany({
    where: {
      userId,
      type: { in: ["checkin_weekly", "checkin_monthly"] },
      deletedAt: null,
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    body: r.body,
    structured: r.structured,
    sentiment: r.sentiment,
    occurredAt: r.occurredAt.toISOString(),
  }));
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function summarizeWeekly(r: Record<string, unknown>): string {
  const challenge = r.challengeLevel ?? "?";
  const energy = String(r.energyFocus ?? "").slice(0, 120);
  return `Weekly pulse — challenge ${challenge}/5. ${energy}`;
}

function summarizeMonthly(r: Record<string, unknown>): string {
  return `Monthly review — satisfaction ${r.satisfaction ?? "?"}/5`;
}
