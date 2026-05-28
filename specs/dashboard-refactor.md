# Dashboard Architecture Refactor

**Date:** May 2026
**Goal:** Migrate heavy dashboard logic from frontend client components to backend API services.

## Overview
Historically, the `CareerPulse`, `RecentActivity`, `InFlight`, and `Greeting` components received a massive nested `profile` payload and independently computed the metrics they needed (e.g. iterating over skills to create sparkline charts).

This refactor introduces a new `/api/v1/profile/me/dashboard` endpoint that pre-calculates and aggregates all of these metrics server-side using direct Prisma queries and data manipulation, before delivering a highly optimized JSON object (`DashboardMetrics`) to the frontend.

## Benefits
1. **Performance:** Eliminates the need to send large, nested relational database models (like the full history of skills and applications) over the network.
2. **Efficiency:** Reduces redundant loops in the React rendering cycle.
3. **Maintainability:** Consolidates business logic (e.g. defining what constitutes a "dormant skill" or how to calculate the profile completeness score) into a single backend service (`dashboard.service.ts`).

## Endpoint Specification
`GET /api/v1/profile/me/dashboard`

**Response (`DashboardMetrics`):**
```ts
{
  pulse: {
    growth: { pattern: number[]; trend: string; observation: string };
    visibility: { pattern: number[]; trend: string; observation: string };
    progression: { pattern: number[]; trend: string; observation: string };
  };
  recentActivity: { label: string; timeAgo: string; category: string; ts: number }[];
  inFlight: {
    activeCount: number;
    closedCount: number;
    applications: { id: string; company: string; roleTitle: string; stage: string; stageLabel: string; stageIdx: number; formattedDate: string }[];
  };
  greeting: {
    dayN: number;
    attentionCount: number;
  };
}
```

## Component Changes
- `CareerPulse`: Receives pre-calculated 12-week patterns and string observations.
- `RecentActivity`: Receives pre-formatted `timeAgo` strings and labels.
- `InFlight`: Receives aggregated active/closed counts and a simplified, formatted array of applications.
- `Greeting`: Continues to calculate "Good morning/afternoon" based on the user's local timezone, but receives the `dayN` and `attentionCount` values directly from the backend.
