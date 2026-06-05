export type MarketDemandTrend = "rising" | "stable" | "declining";

export interface MarketSalaryBand {
  p25: number;
  p50: number;
  p75: number;
  currency: string;
  YoYChangePct?: number;
}

export interface MarketSkillDemand {
  skill: string;
  frequencyPct: number;
}

export interface MarketSampleRole {
  title: string;
  company: string;
  url: string;
  postedAt: string;
}

export interface MarketGapHighlight {
  skill: string;
  gapType: "missing" | "outdated" | "depth_insufficient";
  marketFrequency: number;
}

export interface MarketContext {
  asOf: string;
  sources: string[];
  available: boolean;
  role: { title: string; onetCode?: string };
  location: { city?: string; region?: string; country: string };
  salary?: MarketSalaryBand;
  demand?: {
    postingCount30d?: number;
    trend: MarketDemandTrend;
    topSkills: MarketSkillDemand[];
  };
  gaps?: MarketGapHighlight[];
  sampleRoles?: MarketSampleRole[];
}
