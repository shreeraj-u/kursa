export interface Observation {
  text: string;
  timeAgo: string;
  type: "opportunity" | "warning" | "info";
  /** Present when served from the LLM pipeline (never fallback templates). */
  source?: "llm";
}

export interface ObservationsResponse {
  data: Observation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  generationSource: "llm";
  materialChangeDetected?: boolean;
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
