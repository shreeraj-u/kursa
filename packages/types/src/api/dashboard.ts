export interface Observation {
  text: string;
  timeAgo: string;
  type: "opportunity" | "warning" | "info";
}

export interface ActivityEvent {
  label: string;
  timeAgo: string;
  category: "skill" | "goal" | "work" | "application" | "profile";
  ts: number;
}

export interface FormattedApplication {
  id: string;
  company: string;
  roleTitle: string;
  stage: string;
  stageLabel: string;
  stageIdx: number;
  formattedDate: string;
}

export interface DashboardMetrics {
  pulse: {
    growth: { pattern: number[]; trend: string; observation: string };
    visibility: { pattern: number[]; trend: string; observation: string };
    progression: { pattern: number[]; trend: string; observation: string };
  };
  recentActivity: ActivityEvent[];
  inFlight: {
    activeCount: number;
    closedCount: number;
    applications: FormattedApplication[];
  };
  greeting: {
    dayN: number;
    attentionCount: number;
  };
}
