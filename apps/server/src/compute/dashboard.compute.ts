import { JobApplicationStage, JobApplicationStatus, LearningGoalStatus } from "@kursa/db";

// Pure computation layer for dashboard metrics.
// No DB access — takes pre-loaded data and returns structured metrics.
// Kept separate from dashboard.service.ts so the logic is testable without Prisma.

const STAGES = [
  JobApplicationStage.shortlisted,
  JobApplicationStage.applied,
  JobApplicationStage.phone_screen,
  JobApplicationStage.technical,
  JobApplicationStage.on_site,
  JobApplicationStage.offer,
] as const;

export interface DashboardData {
  user: { createdAt: Date };
  intelligence?: {
    winsThisQuarter: number;
    checkInStreak: number;
    journalActivityScore: number;
    recentWins: Array<{ id: string; body: string; occurredAt: string }>;
    recentEvents: Array<{ id: string; type: string; body: string | null; occurredAt: string }>;
  } | null;
  profile: {
    bio: string | null;
    targetRole: string | null;
    location: string | null;
    yearsOfExperience: number | null;
    aspirations: unknown | null;
    skills: Array<{ name: string; createdAt: Date; lastUsedDate: Date | null; confidenceRating: number | null }>;
    workHistories: Array<{ companyName: string; updatedAt: Date | null; createdAt: Date }>;
    learningGoals: Array<{ skillName: string; status: LearningGoalStatus; deadline: Date | null; createdAt: Date }>;
    jobApplications: Array<{
      id: string;
      company: string;
      roleTitle: string;
      stage: JobApplicationStage;
      status: JobApplicationStatus;
      appliedAt: Date | null;
      nextAction: string | null;
      nextActionAt: Date | null;
    }>;
    socialLinks: Array<{ id: string }>;
  };
}

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function normalize(vals: number[]): number[] {
  const max = Math.max(...vals, 1);
  return vals.map((v) => (v === 0 ? 0 : v / max < 0.4 ? 1 : 2));
}

function getStageIndex(stage: string): number {
  return STAGES.indexOf(stage as (typeof STAGES)[number]) + 1;
}

function formatDate(app: { appliedAt: Date | null; nextActionAt: Date | null }): string {
  if (app.nextActionAt) {
    const d = new Date(app.nextActionAt);
    const now = new Date();
    const diff = Math.floor((d.getTime() - now.getTime()) / 86400000);
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    if (diff === -1) return "yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (app.appliedAt) {
    const daysAgo = Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / 86400000);
    if (daysAgo === 0) return "today";
    if (daysAgo === 1) return "1 day ago";
    return `${daysAgo} days ago`;
  }
  return "";
}

export function computeDashboardMetrics(data: DashboardData) {
  const { user, profile } = data;
  const now = Date.now();

  // --- 1. Career Pulse ---
  const skillWeeks = Array(12).fill(0) as number[];
  profile.skills.forEach((s) => {
    const daysAgo = (now - new Date(s.createdAt).getTime()) / 86400000;
    const weekIdx = Math.floor(daysAgo / 7);
    if (weekIdx < 12) skillWeeks[11 - weekIdx] = (skillWeeks[11 - weekIdx] ?? 0) + 1;
  });

  let completeness = 0;
  if (profile.bio) completeness += 15;
  if (profile.targetRole) completeness += 15;
  if (profile.location) completeness += 10;
  if (profile.yearsOfExperience) completeness += 10;
  if (profile.skills.length >= 3) completeness += 20;
  if (profile.workHistories.length >= 1) completeness += 20;
  if (profile.aspirations) completeness += 10;

  const goalProgress = {
    completed: profile.learningGoals.filter((g) => g.status === LearningGoalStatus.COMPLETED).length,
    total: profile.learningGoals.length,
  };

  const recentSkills = profile.skills.filter((s) => {
    const daysAgo = (now - new Date(s.createdAt).getTime()) / 86400000;
    return daysAgo <= 28;
  });

  const dormantSkill = profile.skills.find((s) => {
    if (!s.lastUsedDate) return false;
    const monthsAgo = (now - new Date(s.lastUsedDate).getTime()) / (86400000 * 30);
    return monthsAgo > 6;
  });

  const growthTrend = recentSkills.length > 0 ? "rising" : profile.skills.length > 0 ? "steady" : "—";
  const visibilityTrend = completeness >= 80 ? "strong" : completeness >= 50 ? "building" : "early";
  const progressionTrend =
    goalProgress.total > 0 && goalProgress.completed / goalProgress.total > 0.5
      ? "on track"
      : goalProgress.total > 0
        ? "in progress"
        : "—";

  const growthPattern = normalize(skillWeeks);
  const visibilityPattern = Array(12)
    .fill(0)
    .map((_, i) => (i < Math.round((completeness / 100) * 12) ? (i >= 10 ? 2 : 1) : 0)) as number[];
  const progressionPattern = Array(12)
    .fill(0)
    .map((_, i) => {
      if (goalProgress.total === 0) return 0;
      const ratio = goalProgress.completed / goalProgress.total;
      const filled = Math.round(ratio * 12);
      return i < filled ? (i >= filled - 2 ? 2 : 1) : 0;
    }) as number[];

  const pulse = {
    growth: {
      pattern: growthPattern,
      trend: growthTrend,
      observation:
        `${profile.skills.length} skills in build.` +
        (dormantSkill ? ` ${dormantSkill.name} hasn't been used recently.` : ""),
    },
    visibility: {
      pattern: visibilityPattern,
      trend: visibilityTrend,
      observation: `Profile ${completeness}% complete.` + (!profile.socialLinks.length ? " Social links missing." : ""),
    },
    progression: {
      pattern: progressionPattern,
      trend: progressionTrend,
      observation:
        goalProgress.total > 0
          ? `${goalProgress.completed}/${goalProgress.total} goals complete.`
          : "No goals set yet.",
    },
  };

  // --- 2. Recent Activity ---
  const events: {
    label: string;
    timeAgo: string;
    category: "skill" | "goal" | "work" | "application" | "profile";
    ts: number;
  }[] = [];
  const cutoff = now - 48 * 3600 * 1000;

  profile.skills.forEach((s) => {
    const ts = new Date(s.createdAt).getTime();
    if (ts > cutoff) {
      events.push({ label: `skill added · ${s.name}`, timeAgo: timeAgo(s.createdAt), category: "skill", ts });
    }
  });

  profile.learningGoals.forEach((g) => {
    const ts = new Date(g.createdAt).getTime();
    if (ts > cutoff) {
      events.push({ label: `goal added · ${g.skillName}`, timeAgo: timeAgo(g.createdAt), category: "goal", ts });
    }
  });

  profile.workHistories.forEach((w) => {
    const dateField = w.updatedAt ?? w.createdAt;
    const ts = new Date(dateField).getTime();
    if (ts > cutoff) {
      events.push({ label: `experience updated · ${w.companyName}`, timeAgo: timeAgo(dateField), category: "work", ts });
    }
  });

  if (data.intelligence) {
    data.intelligence.recentWins.forEach((w) => {
      const ts = new Date(w.occurredAt).getTime();
      if (ts > cutoff) {
        events.push({
          label: `accomplishment logged · ${w.body.slice(0, 40)}`,
          timeAgo: timeAgo(new Date(w.occurredAt)),
          category: "profile",
          ts,
        });
      }
    });

    data.intelligence.recentEvents
      .filter((event) => ["application_update", "github_sync"].includes(event.type))
      .forEach((event) => {
        const ts = new Date(event.occurredAt).getTime();
        if (ts > cutoff && event.body) {
          events.push({
            label: event.body,
            timeAgo: timeAgo(new Date(event.occurredAt)),
            category: event.type === "application_update" ? "application" : "profile",
            ts,
          });
        }
      });
  }

  const recentActivity = events.sort((a, b) => b.ts - a.ts).slice(0, 6);

  // --- 3. In Flight ---
  const CLOSED_STATUSES: JobApplicationStatus[] = [JobApplicationStatus.closed, JobApplicationStatus.passed];
  const activeCount = profile.jobApplications.filter((a) => !CLOSED_STATUSES.includes(a.status)).length;
  const closedCount = profile.jobApplications.filter((a) => CLOSED_STATUSES.includes(a.status)).length;

  const formattedApps = profile.jobApplications.map((app) => ({
    id: app.id,
    company: app.company,
    roleTitle: app.roleTitle,
    stage: app.stage,
    stageLabel:
      app.status === JobApplicationStatus.closed || app.status === JobApplicationStatus.passed ? "not aligned" : app.stage.replace(/_/g, " "),
    stageIdx: getStageIndex(app.stage),
    formattedDate: formatDate(app),
  }));

  // --- 4. Greeting Metadata ---
  const dayN = Math.max(1, Math.floor((now - new Date(user.createdAt).getTime()) / 86400000));
  const overdueGoalsCount = profile.learningGoals.filter(
    (g) => g.deadline && new Date(g.deadline) < new Date() && g.status !== "COMPLETED",
  ).length;
  const dormantSkillsCount = profile.skills.filter(
    (s) => s.lastUsedDate && (now - new Date(s.lastUsedDate).getTime()) / (86400000 * 30) > 6,
  ).length;

  return {
    pulse,
    recentActivity,
    inFlight: { activeCount, closedCount, applications: formattedApps },
    greeting: { dayN, attentionCount: overdueGoalsCount + dormantSkillsCount },
    intelligence: data.intelligence ?? null,
  };
}
