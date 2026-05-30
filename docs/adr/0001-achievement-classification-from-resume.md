# 0001. Achievement classification from résumé text

## Status

Accepted

## Context

During onboarding, Kursa imports a user's résumé and extracts structured Profile
data. Achievements (hackathon wins, awards, publications, talks, open-source
contributions, volunteering, and other notable accomplishments) appear in
résumés as free, unstructured prose with no consistent labelling. To store them
on the Profile, each achievement must be assigned a `type` from the fixed
`AchievementType` enum: `HACKATHON | AWARD | PUBLICATION | SPEAKING |
OPEN_SOURCE | VOLUNTEER | OTHER`.

We considered three approaches for producing that `type`:

1. **Classify with the LLM at extraction time** — the same model call that
   extracts the achievement also assigns its enum type.
2. **A separate keyword/heuristic classifier** — extract raw achievement text,
   then run a rules engine to map keywords ("hackathon", "award", "spoke at") to
   enum values.
3. **Store raw type strings** — keep whatever label the résumé used and defer
   normalisation, accepting an open-ended `type` field.

## Decision

Achievements are classified into the fixed 7-value `AchievementType` enum **by
the LLM at extraction time**. The extraction prompt instructs the model to map
the achievement to exactly one enum value (e.g. hackathons → `HACKATHON`,
talks/conferences → `SPEAKING`, anything unmatched → `OTHER`), and the parser
validates the result against a Zod enum so only valid values are persisted.

## Consequences

- **Simplicity / one model call.** No second classification pass or separate
  rules engine to build and maintain; extraction and classification happen
  together.
- **Closed enum is enforced.** A Zod enum guards persistence, so the database
  only ever holds the seven defined types.
- **Occasional misclassification.** The model may assign the wrong type for an
  ambiguous achievement. This is mitigated by (a) the onboarding **review step**,
  where the user can correct the `type` via a select before anything is saved,
  and (b) the **"never invent" rule** in the prompt, which keeps extraction
  faithful to the résumé text.
- Rejected alternative 2 (keyword classifier) added maintenance cost for
  marginal accuracy gains; rejected alternative 3 (raw strings) pushed
  normalisation downstream and broke the enum contract the rest of the system
  relies on.
