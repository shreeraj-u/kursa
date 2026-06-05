# Intelligence System Verification Guide

## Automated tests

From `apps/server`:

```bash
npm run test
```

Expected: 6 passing tests in `src/compute/intelligence.test.ts` covering enrichment rules and advisor signals.

## Type checks

```bash
cd apps/server && npx tsc -b
cd apps/web && npx tsc -b
```

## Database migration

Apply the new `enrichment` column on `career_event`:

```bash
pnpm db:migrate
# or: npx prisma migrate deploy (from packages/db)
```

## Manual verification (logged-in user)

### 1. Graph linking on ingest

1. Open **Journal** (`/dashboard/journal`)
2. Log an **accomplishment** with skill tags selected
3. Within ~5 seconds, refresh timeline — win should show title + skill chips
4. Check API: `GET /api/v1/journal?page=1` — event should have `linkedSkillIds` populated (after async enrichment)

### 2. Intelligence sidebar (unified surface)

Home shows:
- **Daily suggestions** — proactive nudges (`GET /api/v1/journal/proactive`)

Journal sidebar now shows:
- **Weekly check-in** — due check-in questions (`GET /api/v1/checkins/next`)
- **Engagement chart** — composite trend from relevance API (`GET /api/v1/journal/relevance`)

### 3. Weekly check-in

When backend returns a due check-in, the journal sidebar renders the weekly check-in questions and no separate monthly review is scheduled.

### 4. Evidence-based path alignment

1. Activate a career path
2. Log wins related to a milestone title/description
3. After enrichment, `GET /api/v1/journal/relevance` → `milestoneEvidence` shows event counts
4. Path alignment score increases when milestones have linked events

### 5. Advisory chat

```bash
POST /api/v1/chat                          # create conversation
POST /api/v1/chat/:id/messages             # { "content": "Should I take this promotion?" }
GET  /api/v1/chat                          # list with history
```

### 6. LinkedIn sync (stub)

```bash
POST /api/v1/linkedin/sync
GET  /api/v1/linkedin/status
```

Records a system event when LinkedIn URL is configured on profile.

## Hybrid LLM model

See [LLM_STRATEGY.md](./LLM_STRATEGY.md):
- **Rules**: advisor signals, cold-start observations
- **LLM on ingest**: async enrichment after each journal event (requires the user-supplied OpenAI key on browser/API requests, or optional `OPENAI_API_KEY` for non-browser jobs)
- **LLM nightly**: batch memory distillation job
- **LLM read-time**: observations, impact bullet generation, paths (existing)

Without an OpenAI key, rule-based enrichment still runs (skills, themes, milestone keyword matching).
