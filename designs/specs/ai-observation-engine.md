# AI Observation Engine — Implementation Spec

**Status:** Ready to build  
**Replaces:** Rule-based logic in `apps/server/src/services/insights.service.ts`

---

## What you're building and why

Right now observations are templates. "Your React work has slowed down." could appear on anyone's screen. The goal is observations that could only appear on *your* screen — because they synthesise multiple things about you that no template can combine.

The approach avoids being a "GPT wrapper" by using a **signals layer**: you compute facts about the user in plain TypeScript first, then GPT's only job is to interpret and write — not extract. GPT can't hallucinate facts it was never given.

---

## Architecture overview

```
Request hits GET /api/v1/profile/me/observations
           ↓
insights.service.ts      ← orchestrator (you'll modify this)
  ├── Load profile from DB
  ├── insights.compute.ts  ← YOU BUILD: pure TS signals, no AI
  ├── insights.classify.ts ← YOU BUILD: GPT classifies career trajectory
  └── generateObservations()  ← YOU BUILD: GPT synthesises signals → observations
           ↓
Observation[] returned to client (loaded async, not blocking page render)
```

---

## Step 1 — Install the OpenAI SDK

In `apps/server/`, run:
```
pnpm add openai
```

Then in `packages/env/src/server.ts`, add this to the server env schema:
```ts
OPENAI_API_KEY: z.string().min(1),
```

**Why:** `t3-env` validates env vars at startup. If `OPENAI_API_KEY` is missing, the server won't start — which is better than a runtime crash on the first AI call.

Add `OPENAI_API_KEY=sk-...` to your `.env` file.

---

## Step 2 — Add `careerTrajectory` to the Profile schema

In `packages/db/prisma/schema.prisma`, inside the `Profile` model, add:

```prisma
careerTrajectory  String?  // "linear" | "accelerating" | "stagnating" | "pivoting"
```

Then run:
```
pnpm --filter @kursa/db exec prisma migrate dev --name add-career-trajectory
```

**Why:** Career trajectory only changes when work history changes. Computing it via GPT every time someone loads observations would be wasteful. You compute it once, store it, and reuse it. When work history is updated, the field goes stale and gets lazily recomputed on the next observations load.

---

## Step 3 — Build `insights.compute.ts`

Create `apps/server/src/services/insights.compute.ts`.

This is a **pure function** — no OpenAI calls, no database calls. It takes data already loaded from the DB and returns a `ProfileSignals` object. Think of it like `dashboard.compute.ts` — same pattern.

**What to export:**

```ts
export interface ProfileSignals {
  targetRole: string | null
  careerTrajectory: string | null           // from DB — already classified
  profileCompleteness: number               // 0-100
  dormantHighValueSkills: string[]          // confidence >= 4, unused > 6 months
  overdueGoals: string[]                    // deadline passed, not completed
  goalsCompletionRatio: { completed: number; total: number }
  daysSinceLastApplication: number | null   // null = never applied
  hasAppliedToTargetRole: boolean           // true if targetRole set AND applications exist
  currentRoleTenureMonths: number | null    // from the isCurrent work history entry
  hasWorkOutcomes: boolean                  // is any outcomes JSON field non-empty?
  aspirationsSet: boolean                   // threeYear or fiveYear or targetRoles populated
  skillsNeverDated: string[]               // skills with no lastUsedDate
  noRecentSkillActivity: boolean           // no skill added/updated in last 90 days
}

export function computeProfileSignals(profile: /* your loaded profile type */): ProfileSignals
```

**Tips for implementing each signal:**

- **`dormantHighValueSkills`**: filter skills where `lastUsedDate` exists, is more than 6 months ago, and `confidenceRating >= 4`. Return just the names.
- **`profileCompleteness`**: same logic as `dashboard.compute.ts` — look at how it scores `bio`, `targetRole`, `location`, `yearsOfExperience`, `skills.length`, `workHistories.length`, `aspirations`.
- **`daysSinceLastApplication`**: find the most recent `appliedAt` across all `jobApplications`, compute days since. Return null if no applications exist.
- **`hasAppliedToTargetRole`**: return `true` if `targetRole` is set AND `jobApplications.length > 0`. Return `false` if target role is set but applications are empty (this is an opportunity signal).
- **`currentRoleTenureMonths`**: find the work history entry where `isCurrent === true`, compute months from `startDate` to today.
- **`noRecentSkillActivity`**: check if any skill has `updatedAt` or `createdAt` within the last 90 days. If none do, return true.

---

## Step 4 — Build `insights.classify.ts`

Create `apps/server/src/services/insights.classify.ts`.

This file has one job: call OpenAI and classify the user's career trajectory from their work history. It's isolated so that when you add BullMQ later, you move the call site — not the function.

```ts
import OpenAI from "openai"
import { env } from "@kursa/env/server"

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

type CareerTrajectory = "linear" | "accelerating" | "stagnating" | "pivoting"

export async function classifyCareerTrajectory(
  workHistories: Array<{
    roleTitle: string
    companyName: string
    startDate: Date
    endDate: Date | null
    isCurrent: boolean
  }>
): Promise<CareerTrajectory> {
  // call OpenAI here
  // system prompt: explain the four trajectory types, ask for one word classification
  // user message: JSON.stringify(workHistories)
  // parse the response, validate it's one of the four values
  // return it
}
```

**Tips:**
- Use `gpt-4o-mini` — it's cheap and this is a simple classification task.
- Ask for JSON output: `response_format: { type: "json_object" }` and tell the model to return `{ "trajectory": "..." }`.
- Validate the response is one of the four allowed values before returning. If it isn't, default to `"linear"`.

**System prompt example:**
```
Classify a person's career trajectory from their work history into exactly one of:
- "linear": steady progression in the same field
- "accelerating": rapid advancement, increasing seniority
- "stagnating": little movement or growth over time
- "pivoting": significant change in field, industry, or role type

Return JSON: { "trajectory": "linear" | "accelerating" | "stagnating" | "pivoting" }
```

---

## Step 5 — Update `insights.service.ts`

Replace the current multi-query pattern with this flow:

```ts
export async function getObservations(userId: string, page: number, limit: number) {
  // 1. Load full profile in one query (skills, goals, applications, workHistories, aspirations, values)
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { skills: true, learningGoals: true, jobApplications: true, workHistories: true }
  })
  if (!profile) return null

  // 2. Check in-memory cache — if profile hasn't changed since last call, return cached result
  const key = `${profile.id}:${profile.updatedAt.toISOString()}`
  if (observationsCache.has(key)) {
    const cached = observationsCache.get(key)!
    return paginate(cached, page, limit)
  }

  // 3. Sparse profile guard — if too little data, use rule-based fallback
  if (profile.skills.length < 2 && profile.workHistories.length < 1) {
    return ruleBasedFallback(profile, page, limit)
  }

  // 4. Lazy trajectory classification — compute once, store on profile
  if (!profile.careerTrajectory && profile.workHistories.length > 0) {
    const trajectory = await classifyCareerTrajectory(profile.workHistories)
    await prisma.profile.update({
      where: { id: profile.id },
      data: { careerTrajectory: trajectory }
    })
    profile.careerTrajectory = trajectory  // update in-memory for this request
  }

  // 5. Compute signals — pure function, no AI
  const signals = computeProfileSignals(profile)

  // 6. Generate observations via OpenAI
  const observations = await generateObservations(signals)  // implement this next

  // 7. Cache result
  observationsCache.set(key, observations)

  return paginate(observations, page, limit)
}
```

**The in-memory cache:**
```ts
const observationsCache = new Map<string, Observation[]>()
```

Declare this at the top of the file (module scope). It's keyed by `profileId:updatedAt` — so if the profile changes, the key changes and the cache is automatically bypassed.

**`generateObservations(signals)`** — implement inside `insights.service.ts`:
- OpenAI call with `gpt-4o-mini`
- System prompt: your role, the output rules, the JSON schema (see below)
- User message: `JSON.stringify(signals)`
- Parse with Zod, retry once on failure, throw on second failure (caught by the outer try/catch)

**System prompt for observations:**
```
You are a career intelligence engine. Given pre-computed signals from a user's career profile,
generate 3 to 5 concise, specific observations about their professional situation.

Rules:
- Each observation MUST be specific to this user — it cannot be generalisable to any other user
- "warning": something they should address (dormant skill, overdue goal, stagnating trajectory)
- "opportunity": something they could act on right now
- "info": a neutral but useful pattern worth knowing
- Maximum 2 sentences per observation. Plain English. No jargon. No hedging.
- Return ONLY a JSON array. No prose before or after.

Return format: [{ "text": "...", "type": "opportunity" | "warning" | "info" }]
```

**Zod schema for validation:**
```ts
import { z } from "zod"

const observationSchema = z.array(
  z.object({
    text: z.string(),
    type: z.enum(["opportunity", "warning", "info"]),
  })
)
```

**Wrap everything in try/catch:**
```ts
try {
  // steps 4-7 above
} catch {
  return ruleBasedFallback(profile, page, limit)
}
```

Move the existing rule-based logic into a `ruleBasedFallback()` helper so it's still callable.

---

## Step 6 — Decouple observations from the dashboard page render

In `apps/web/src/app/dashboard/page.tsx`, the current `Promise.all` fetches observations server-side, blocking the entire page render. Remove observations from it:

```ts
// Before
const [profileData, observationsData, metricsData] = await Promise.all([...])

// After
const [profileData, metricsData] = await Promise.all([
  serverFetch<{ profile: UserProfile | null }>("/api/v1/profile/me").catch(() => null),
  serverFetch<DashboardMetrics>("/api/v1/profile/me/dashboard").catch(() => null),
])
```

Pass `null` as `initialObservations` to the `Dashboard` component. The dashboard component should fetch observations client-side using a `useEffect` after mount. This means the page renders immediately and the observations card fills in asynchronously.

---

## What to add `timeAgo` as

All AI-generated observations should have `timeAgo: "noticed · today"` — set this in the service after getting the array back from GPT. GPT doesn't need to generate it.

---

## How to verify it works

1. Open the dashboard — the page should render immediately without waiting for observations
2. The observations card should populate 1–3 seconds later
3. Check that the observation text mentions your actual skill names or goals — not generic templates
4. Call the endpoint twice — the second response should be near-instant (cache hit)
5. Temporarily break your `OPENAI_API_KEY` — observations should still appear (rule-based fallback)
6. Add a new work history entry — then load observations and check `profile.careerTrajectory` was written to the DB

---

## File map

```
apps/server/src/services/
├── insights.compute.ts    ← CREATE: pure signals function
├── insights.classify.ts   ← CREATE: trajectory classification via OpenAI
└── insights.service.ts    ← MODIFY: orchestrate the above

packages/db/prisma/
└── schema.prisma          ← MODIFY: add careerTrajectory to Profile

packages/env/src/
└── server.ts              ← MODIFY: add OPENAI_API_KEY

apps/server/
└── package.json           ← MODIFY: add openai dependency

apps/web/src/app/dashboard/
├── page.tsx               ← MODIFY: remove observations from Promise.all
└── dashboard.tsx          ← MODIFY: client-side observations fetch
```
