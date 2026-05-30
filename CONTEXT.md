# Kursa — Context Glossary

Kursa is a persistent AI career advisor. It builds an evolving model of a user's
professional identity (the **Profile**) and uses it to deliver specific, reasoned,
personalised guidance over time.

## Glossary

### Profile
The system's evolving model of a single user's professional identity: skills, work
history, education, achievements, projects, languages, work authorizations,
constraints, learning goals, social links, aspirations, and job applications.
"The profile is the product" — every feature's quality depends on it. One Profile
per User.

### Career Path
An AI-generated projection of a realistic professional trajectory for a user,
derived from their Profile. A user has several at once (typically 3). Each Career
Path has a title, description, confidence score (0–1, how achievable given the
current Profile), projected timeline, and an ordered list of **Milestones**.

Career Paths are **disposable**: regeneration freely replaces a user's existing
paths with a fresh set. They are AI output, not durable user records. The only
user state attached to a path is **activation** (see Active Path).

### Milestone
An ordered step within a Career Path: title, description, estimated months from
now, salary band, and the skills it requires. A Milestone carries a **status**
(`not_started` / `in_progress` / `completed`) that is **inferred by the AI at
generation time** from the Profile — it is NOT user-edited in Phase 2. Manual
milestone progress tracking is deferred to a later phase.

### Active Path
The single Career Path a user has chosen as their primary focus. Activation is the
only piece of user state on a path. Downstream features (skill gaps, job matching,
resume) are intended to align to the Active Path. At most one path is active at a
time.

### Regeneration
Replacing a user's current set of Career Paths with a freshly generated set.
Triggered explicitly by the user ("regenerate paths") and, in later phases,
automatically when the Profile changes significantly. Because paths are disposable,
regeneration does not preserve milestone status and **clears activation** — the new
path set comes back with nothing active, and the user re-selects their Active Path.
