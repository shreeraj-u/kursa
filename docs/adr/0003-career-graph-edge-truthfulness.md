# Career Graph renders only real relationships, never AI-inferred edges

The Career Graph visualises the whole Profile as a node-link graph. We decided its
edges may come **only** from relationships actually present in the data — a
milestone's `requiredSkills` name-match to an owned skill, a learning goal's
`skillName` match, a project's `workHistoryId` foreign key, and the milestone
sequence — plus the central You→entity spokes. We deliberately do **not** infer
"demonstrates" links (e.g. which skills a project or job exhibits), even though that
would produce a denser, more impressive web.

## Why

The graph's value as a career *advisor* surface depends on it being trustworthy:
skills are the connective tissue, and the diagnostic that matters (a milestone
requires a skill the Profile lacks = a visible **gap**) is only meaningful if every
edge is real. Inventing relationships would let the graph assert things about the
user that aren't true, which contradicts the system-wide rule already in the
glossary that the AI never invents Profile evidence. A sparse-but-true graph beats a
dense-but-fabricated one. Bonus: this keeps the feature frontend-only — it builds
client-side from the existing Profile + Journey endpoints with no backend or schema
work.

## Considered and rejected

- **AI-inferred edges** — an LLM step inferring Project→Skill / Job→Skill links from
  free text. Rejected: invents relationships, violates the no-invented-evidence
  principle, and adds server cost/latency.
- **Add real linkage to the data model** — many-to-many Skill↔Project /
  Skill↔WorkHistory tables plus an Achievement→source FK, backfilled. Rejected for
  now as far beyond a dashboard page; revisit if dense, truthful linkage becomes a
  product priority. If those columns ever exist, this ADR's constraint is satisfied
  by simply reading them — the rule is "edges must be real," not "edges must stay
  sparse."

## Consequence

Achievements, education, and languages connect only to the central You node (they
have no FK to anything else), so they read as spokes, not web. That is accepted and
expected, not a bug to be "fixed" by inferring links.
