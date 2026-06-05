# 0002. Two-dimension skill strength (confidence + proficiency)

## Status

Accepted

## Context

The `Skill` model has carried two self-assessment fields since the initial schema:
`confidenceRating` (an integer 1–5) and `proficiencyLevel` (an enum:
`beginner` / `intermediate` / `advanced` / `expert`). In practice only
`confidenceRating` was ever populated — onboarding's skills step captures it, and
the dashboard's dormancy logic reads it. `proficiencyLevel` sat on the model,
written nowhere and read nowhere.

Building the [[Skill inventory]] page (`/dashboard/skills`) forced the question:
what does a skill's "strength" mean, and how is it shown and edited? Three options
were on the table:

1. **Confidence only** — make `confidenceRating` the single canonical measure and
   retire `proficiencyLevel` from the UI (leaving it dormant on the model).
2. **Proficiency only** — switch to the enum as the canonical measure; backfill it
   from confidence and rewire onboarding + dashboard.
3. **Both, as distinct dimensions** — surface and edit confidence *and* proficiency
   as independent signals on every skill.

## Decision

We chose **both, as distinct dimensions**. Confidence and proficiency measure
genuinely different things and are not derivable from one another:

- **Confidence** (`confidenceRating`, 1–5) — how self-assured the user feels about
  the skill.
- **Proficiency** (`proficiencyLevel`, beginner→expert) — the actual mastery level.

A user can be highly confident yet objectively intermediate, or an expert who has
gone rusty and rates their confidence low. Collapsing the two would discard signal
the profile is meant to capture ("the profile is the product").

On the Skill inventory page, confidence renders as the strength **bar** (1–5) and
proficiency renders as a separate **badge / segmented control**. `proficiencyLevel`
remains nullable: it is unset for existing skills until the user edits them, rather
than backfilled.

## Consequences

**Positive:**
- Richer, more honest profile signal; downstream features (observations, path/gap
  generation, résumé shaping) can reason about confidence and mastery separately.
- No data migration: both fields already exist; `proficiencyLevel` simply starts
  getting written.

**Negative:**
- More input friction — two dials per skill instead of one.
- `proficiencyLevel` is null for all pre-existing skills and for any skill added
  through onboarding (which still captures confidence only) until manually set, so
  the UI must handle a "proficiency not set" state gracefully.

**Neutral:**
- Onboarding continues to capture confidence only for now; adding proficiency to the
  onboarding skills step is a possible follow-up, not part of this decision.
