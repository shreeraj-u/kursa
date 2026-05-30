# ADR 0001 — Use OpenAI for the AI layer (diverging from the PRD's Claude)

**Status:** Accepted
**Date:** 2026-05-30

## Context

The PRD (`designs/specs/PRD-optimized.md`, §"AI Integration Decisions") specifies
Anthropic Claude for the AI layer: *"Claude Sonnet 4.6 for generation tasks… Claude
Haiku 4.5 for high-frequency classification"*, and relies on Anthropic prompt caching
for the Phase 5 advisory chat.

The codebase, however, already runs entirely on OpenAI:

- `apps/server/src/lib/openai.ts` — the single AI client
- `Models = { fast: "gpt-4o-mini", smart: "gpt-4o" }` (`lib/ai/prompts.ts`)
- Every shipped AI module uses it: `insights.generate`, `insights.classify`,
  `resume-parser`.

When building Phase 2 (Career Path Intelligence), we had to decide whether the new
path-generation module should follow the PRD (introduce Claude) or the code (OpenAI).

## Decision

The AI layer uses **OpenAI**, project-wide. New AI modules (starting with career-path
generation) use the existing `openai` client and `Models.smart`/`Models.fast`.

This is a deliberate divergence from the PRD, not an oversight.

## Consequences

- One provider, one SDK, one key (`OPENAI_API_KEY`), one prompt/response convention
  across the whole AI layer. No mixed-provider complexity mid-build.
- Phase 2 gains nothing from Claude specifically (Anthropic prompt caching only
  matters for the always-on profile context in the Phase 5 chat).
- The PRD's example schema and the code now disagree on provider. **A future reader
  holding the PRD should not "fix" this by rewriting a module to Claude.** Any
  migration to Claude is a separate, deliberate, project-wide decision that would
  touch `insights.generate`, `insights.classify`, `resume-parser`, and
  `paths.generate` together — and would re-evaluate prompt-caching for the chat.
- Structured-output validation (Zod) and the retry-then-fallback contract from the
  PRD §"AI Integration Decisions" are provider-agnostic and still apply.
