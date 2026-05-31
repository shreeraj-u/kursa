# Intelligence Layer — Implementation Spec

**Status:** Active  
**Companion:** [deep-profiling-assessment.md](./deep-profiling-assessment.md)

---

## Overview

Every signal source writes a `CareerEvent`. Extraction + `ProfileUpdateDelta` update the structural profile. `UserMemory` stores distilled facts. `assembleAdvisorContext(purpose)` feeds observations, paths, journal, and (future) chat.

Flow: **event → extract (TS) → apply delta → distill memory → assemble context → LLM narrates**

---

## CareerEvent types and payloads

| Type | Source | structured JSON |
|------|--------|-----------------|
| `checkin_weekly` | user | `{ energyFocus, challengeLevel, rememberThis? }` |
| `checkin_monthly` | user | `{ satisfaction, growth, management, valuesAlignment, blockers, winsSinceLast }` |
| `win` | user | `{ title, body, skillNames? }` |
| `note` | user | `{ body }` |
| `feedback` | user | `{ body, fromRole: manager \| peer \| self }` |
| `decision` | user | `{ title, body, outcome? }` |
| `learning` | user | `{ skillName, body? }` |
| `aria_observation` | aria | `{ text, observationType }` |
| `profile_import` | system | `{ resumeFileName?, skillCount, workHistoryCount }` |
| `onboarding_complete` | system | `{ skillCount, workHistoryCount }` |
| `application_update` | user | `{ applicationId, stage, notes? }` |
| `system` | system | `{ kind, payload }` |

---

## ProfileUpdateDelta

```typescript
interface ProfileUpdateDelta {
  skillLastUsed?: Array<{ name: string; date?: Date }>;
  newAchievements?: Array<{ title: string; description?: string; dateAchieved?: Date; skillNames?: string[] }>;
  newLearningGoals?: Array<{ skillName: string }>;
  workHistoryPatches?: Array<{ id: string; outcomes?: unknown }>;
}
```

### Delta mapping

| Event type | Delta |
|------------|-------|
| `win` | `newAchievements`, `skillLastUsed` from skillNames |
| `checkin_weekly` | `skillLastUsed` if rememberThis mentions skill; memory only for low challenge streak |
| `learning` | `newLearningGoals` |
| `feedback` | optional `newAchievements` if body length > 40 |
| `profile_import` | none (onboarding transaction handles profile) |
| `onboarding_complete` | none |

---

## UserMemory categories

- `sentiment` — engagement / satisfaction patterns
- `pattern` — repeated themes
- `skill` — skill usage facts
- `goal` — aspiration alignment
- `milestone` — path evidence
- `contradiction` — intention vs action

Fields: `fact`, `confidence` (0–1), `sourceEntryIds[]`, `validFrom`, `validUntil?`

---

## AdvisorContext

```typescript
interface AdvisorContext {
  purpose: "observations" | "paths" | "journal" | "chat";
  profile: ProfileInput;
  signals: AdvisorSignals;
  recentEvents: CareerEventSummary[];
  memories: UserMemorySummary[];
  activePath?: CareerPath | null;
}
```

Retrieval budgets:
- **observations:** signals + top 5 memories + 4-week event summary
- **paths:** full profile snapshot + milestone evidence + contradictions
- **journal:** pattern findings only
- **chat:** full bundle (future)

---

## API routes

```
GET  /api/v1/journal
POST /api/v1/journal/win
POST /api/v1/journal/note
GET  /api/v1/journal/context
GET  /api/v1/journal/trend
GET  /api/v1/journal/review-prep

GET  /api/v1/checkins/next
POST /api/v1/checkins
GET  /api/v1/checkins/history

GET  /api/v1/memory
```

---

## PersistedObservation

Stored when observations regenerate. `signalsHash` = hash of signals + memory ids. TTL 24h default.

Each AI observation also ingests `CareerEvent` type `aria_observation`.
