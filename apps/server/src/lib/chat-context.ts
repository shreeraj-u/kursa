import type { AdvisorContext } from "@kursa/types";

const MAX_HISTORY_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 1_500;
const MAX_EVENT_BODY = 200;
const MAX_EVENTS = 12;
const MAX_MEMORIES = 12;
const MAX_ASPIRATIONS_JSON = 2_000;

/** Safe JSON for OpenAI context (Dates → ISO, drop huge blobs). */
export function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (typeof v === "bigint") return v.toString();
    if (v instanceof Date) return v.toISOString();
    return v;
  });
}

export function trimChatHistory(
  messages: Array<{ role: string; content: string }>,
): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  return messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content.length > MAX_MESSAGE_CHARS
      ? `${m.content.slice(0, MAX_MESSAGE_CHARS)}…`
      : m.content,
  }));
}

export function buildSlimChatContextPayload(context: AdvisorContext) {
  const nextMilestone = context.activePath?.milestones.find(
    (m) => m.status === "in_progress" || m.status === "not_started",
  );

  const currentJob =
    context.profile.workHistories.find((w) => w.isCurrent) ??
    context.profile.workHistories[0];

  const workHistories = context.profile.workHistories.slice(0, 5).map((w) => ({
    companyName: w.companyName,
    roleTitle: w.roleTitle,
    isCurrent: w.isCurrent,
    startDate: w.startDate instanceof Date ? w.startDate.toISOString() : w.startDate,
  }));

  let aspirations = context.profile.aspirations;
  const aspirationsJson = safeJsonStringify(aspirations);
  if (aspirationsJson.length > MAX_ASPIRATIONS_JSON) {
    aspirations = { _truncated: true, preview: aspirationsJson.slice(0, MAX_ASPIRATIONS_JSON) };
  }

  const lastWin = context.recentEvents.find((e) => e.type === "win");

  return {
    identity: {
      targetRole: context.profile.targetRole,
      careerTrajectory: context.profile.careerTrajectory,
      yearsOfExperience: context.profile.yearsOfExperience,
      location: context.profile.location,
      bio: context.profile.bio?.slice(0, 500) ?? null,
      currentEmployer: currentJob?.companyName ?? null,
      currentRole: currentJob?.roleTitle ?? null,
    },
    workHistories,
    aspirations,
    activePath: context.activePath
      ? {
          title: context.activePath.title,
          confidence: context.activePath.confidenceScore,
          nextMilestone: nextMilestone?.title ?? null,
        }
      : null,
    signals: {
      winsThisQuarter: context.signals.winsThisQuarter,
      checkInStreak: context.signals.checkInStreak,
      sentimentTrend12w: context.signals.sentimentTrend12w,
      intentionActionGap: context.signals.intentionActionGap,
      profileCompleteness: context.signals.profileCompleteness,
      currentRoleTenureMonths: context.signals.currentRoleTenureMonths,
      repeatedThemes: context.signals.repeatedThemes?.slice(0, 5),
    },
    memories: context.memories.slice(0, MAX_MEMORIES).map((m) => ({
      fact: m.fact.slice(0, 300),
      category: m.category,
    })),
    recentActivity: context.recentEvents.slice(0, MAX_EVENTS).map((e) => ({
      type: e.type,
      occurredAt: e.occurredAt,
      body: e.body?.slice(0, MAX_EVENT_BODY),
      themes: e.enrichment?.themes?.slice(0, 5),
    })),
    lastLoggedWin: lastWin
      ? {
          occurredAt: lastWin.occurredAt,
          body: lastWin.body?.slice(0, MAX_EVENT_BODY),
        }
      : null,
    learningGoals: context.profile.learningGoals.slice(0, 5),
    materialChangeDetected: context.materialChangeDetected,
    marketContext: context.marketContext
      ? {
          available: context.marketContext.available,
          asOf: context.marketContext.asOf,
          sources: context.marketContext.sources,
          roleTitle: context.marketContext.role.title,
          salary: context.marketContext.salary,
          sampleRoles: context.marketContext.sampleRoles?.slice(0, 5),
          demand: context.marketContext.demand
            ? {
                trend: context.marketContext.demand.trend,
                postingCount30d: context.marketContext.demand.postingCount30d,
                topSkills: context.marketContext.demand.topSkills?.slice(0, 5),
              }
            : undefined,
          gaps: context.marketContext.gaps?.slice(0, 5),
        }
      : null,
  };
}
