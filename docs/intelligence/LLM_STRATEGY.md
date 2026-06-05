# Hybrid LLM Intelligence Strategy

Kursa uses a **tiered hybrid** model for profiling and intelligence.

## Rules (deterministic, no LLM)

- Profile completeness, dormant skills, overdue goals, application recency
- Check-in streak, wins-this-quarter, date math
- `signalsHash` cache invalidation for observations
- Cold-start observations when profile has fewer than 5 events

## LLM on ingest (gpt-4o-mini, async)

Triggered after every `CareerEvent` write via `enrichment.service.ts`:

- Skill and entity extraction from win/note/feedback text
- Theme classification (leadership, technical, stakeholder, delivery)
- Milestone matching against active career path
- Sentiment for wins and notes (extends beyond check-ins)
- Immediate memory candidates for significant events

Browser/API requests use the OpenAI key supplied by the current user; local scripts or non-browser jobs may use optional `OPENAI_API_KEY`. Rule-based fallback runs when OpenAI is unavailable.

## LLM nightly batch

- Semantic memory distillation over last 30 days
- Contradiction detection and supersession via `validUntil` / `supersededBy`
- Confidence decay for unreinforced memories (90 days)

## LLM at read time (cached)

- Observations, impact bullet generation, path generation
- Inputs are pre-computed `AdvisorContext` + evidence graph
- Outputs cite `sourceEntryIds` and linked skills

## Do NOT use LLM in

- `computeAdvisorSignals()` — must stay fast, cheap, deterministic on every read
