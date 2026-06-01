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

### Skill
A single skill or ability in a user's [[Profile]], with a name and a category
(`technical` / `soft` / `tool`). A skill's strength is captured on **two distinct
dimensions**: **confidence** (`confidenceRating`, 1–5 — how self-assured the user
feels) and **proficiency** (`proficiencyLevel` — `beginner` / `intermediate` /
`advanced` / `expert`, the actual mastery level). These are independent: a user can
be highly confident yet objectively intermediate, or expert but rusty. A Skill also
tracks **recency** (`lastUsedDate`) and a **source** (self-reported, résumé, or
inferred). Skill names are unique per Profile (case-insensitive). Skills are
created in bulk at onboarding but maintained one at a time afterwards (see
[[Skill inventory]]).

### Skill inventory
The user-facing surface (the Skills page) for viewing and maintaining the [[Skill]]s
in a Profile: add a skill, rate its confidence and proficiency, recategorise, and
remove it — each as an individual change, not a bulk rewrite. Skills are grouped by
category; recency (`lastUsedDate`) is shown read-only where present (no manual
editing — it is populated by later phases). The same surface also manages the user's
**learning goals** (the "being built" set). Distinct from **skill-gap analysis**,
which compares the inventory against the [[Active Path]] and is a separate surface
owned elsewhere.

### Dormant skill
A [[Skill]] not used recently — `lastUsedDate` older than ~6 months, especially when
confidence is high (≥4). Surfaced as faded in the [[Skill inventory]] and as a
dashboard observation, prompting the user to refresh or re-apply it.

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
(`not_started` / `in_progress` / `completed`) that is set by the AI from journal
evidence **or** by the user as a manual override — user-set status always takes
precedence and is never overridden by AI enrichment. Manual status is lost when
the user regenerates their paths (they are warned before proceeding).

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

### Résumé
A generated document that starts as a live output of the system's knowledge of the
user. AI generation is derived from the Profile and shaped toward the user's
Active Path / target role. Its section order is **seniority-aware**: the engine
chooses the order from the Profile (new grads lead with education and projects and
omit the summary; experienced users lead with summary and experience). The Profile's
**Achievements** surface here as the **Others** section — a compact block grouping
achievements by type (Hackathons, Awards, …); the section is titled "Others" but is
sourced from the [[Achievement]] entity, and the two names must stay linked. A user
may then make résumé-only manual edits — including adding or removing experiences,
bullets, projects, achievements, education, or certifications — to tailor the
selected version without changing the Profile source of truth. Résumés are **append-only versioned** at generation time (see
Resume version); each is stored with an ATS score and is downloadable as a real,
text-based (ATS-readable) PDF. Generation is bounded by a Generation quota.

### Resume version
One résumé. AI **generation** appends a new version (incrementing integer) tagged
with the path/target role it was shaped for; generation never overwrites an earlier
version. History is retained up to a fixed cap (newest kept). **Manual user edits,
by contrast, mutate the selected version in place** — editing text or adding/removing
résumé-only items does not create a new version and does not write back to the
Profile.

### ATS score
A 0–100 score of how well a résumé would pass automated applicant-tracking screening
for its target role, produced alongside a list of specific, actionable issues
(`severity`, `message`, `fix`). Scored by the AI at generation time, and re-scorable
on demand ("analyze ATS again") after the user edits the text. Re-analysis updates
the score in place, does **not** consume the Generation quota (it creates no new
version), and is guarded by the single-in-flight lock.

### Impact statement
A work-experience bullet written as context → action → outcome with concrete,
truthful results. The résumé engine rewrites raw responsibilities into impact
statements inline during generation; it never invents metrics not present in the
Profile.

### Generation quota
A per-user daily cap on AI résumé generations (default 10/day), enforced server-side
as the cost guardrail. Counted from the timestamps of today's résumé rows — no
separate usage table. Structured to become tier-aware (Free/Pro/Premium) later.

### Achievement
A notable professional accomplishment in a user's Profile, classified by type
(hackathon, award, publication, speaking, open source, volunteer, or other).
Distinct from WorkHistory (employment) and Project (built artifacts). Extracted
from the résumé during onboarding.

### Project
A discrete piece of work a user built or contributed to, with a title,
description, optional link, dates, and outcomes. May exist independently of any
single employer. Feeds the résumé's projects section.

### Résumé import
The onboarding flow that turns an uploaded résumé into structured Profile data:
the system **extracts** entities, the user **reviews/edits** them in the chat,
and they **persist** to the Profile on completion. The uploaded source file and
raw extracted text are ephemeral import inputs, not durable user artifacts; after
parsing, only reviewed structured Profile data persists. Extraction never invents
data not present in the résumé.


### Profile Intake Review
An ephemeral AI/deterministic review that runs after onboarding data entry and
before final Profile persistence. It checks the structured draft for validation
errors, unsafe prompt-like content, thin entries, and obvious consistency issues,
then returns critical issues, warnings, and suggestions for the user to accept or
ignore. It is **suggest-only**: proposed values are grounded in user-provided draft
fields, no review output is durable, and only user-accepted final Profile data is
persisted. It is distinct from the durable Profile source of truth.
