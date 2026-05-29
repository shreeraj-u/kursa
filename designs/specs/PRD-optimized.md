# Product Requirements Document — Kursa: AI Career Advisor Agent

**Version:** 2.0  
**Status:** Active  
**Last Updated:** May 2026  
**Supersedes:** PRD v1.0

---

## Problem Statement

Most professionals manage their careers reactively — they only engage with career tools during a crisis (job loss, burnout, missed promotion). When they do engage, they're forced to juggle 5+ disconnected tools (LinkedIn, job boards, resume builders, salary sites, coaches) that share no state and produce generic advice.

Quality career coaching exists but is unaffordable for most people ($200–500/hr). Existing AI tools produce advice that could have been given to anyone — they don't know the user.

The result: careers that drift rather than compound intentionally.

---

## Solution

A persistent AI career advisor that builds a deep, evolving model of each user's professional identity over time, and uses that model to deliver specific, reasoned, personalised guidance — continuously, not just during job searches.

The key differentiator is **persistent memory**: the platform gets smarter the longer the user uses it. A recommendation made after six months of check-ins is fundamentally better than one made on day one.

**One-line pitch:** "Your AI career advisor that gets smarter the longer you use it."

---

## User Stories

### Profile & Onboarding
1. As a new user, I want to sign up with email/password or Google so that I can get started without friction.
2. As a new user, I want to be guided through an onboarding flow so that my profile is meaningful before I see any analysis.
3. As a new user, I want to upload my resume (PDF/DOCX) so that the system pre-populates my work history and skills without manual data entry.
4. As a user, I want to see a profile completeness score so that I know what's missing and why it matters.
5. As a user, I want to add and rate my skills (with confidence level and recency) so that the system accurately represents my depth, not just breadth.
6. As a user, I want to log work history entries with outcomes and responsibilities so that the system can distinguish what I did from what I delivered.
7. As a user, I want to set preferences (work environment, risk appetite, salary range, team size) so that recommendations respect my actual constraints.
8. As a user, I want to define my career aspirations (3-year and 5-year goals, target roles, success definition) so that path generation reflects my intentions, not averages.
9. As a user, I want to add education, certifications, projects, and achievements so that the system has a complete professional picture.
10. As a user, I want to see a single observation on my first visit so that I leave session one feeling the platform already knows something useful about me.

### Dashboard & Observations
11. As a returning user, I want to see a dashboard with my key metrics (growth, visibility, progression) so that I can track momentum at a glance.
12. As a user, I want to see AI-generated observations about my profile (dormant skills, overdue goals, application gaps) so that I'm proactively informed rather than having to ask.
13. As a user, I want observations to be specific to my profile, not generic so that I trust the advice is actually about me.
14. As a user, I want to see my recent career activity in a timeline so that I have a record of progress without manual tracking.
15. As a user, I want to see my in-flight job applications and their stages so that I have one place to track active opportunities.

### Career Path Intelligence
16. As a user, I want the system to generate 3–5 distinct career paths based on my profile so that I can see realistic options I might not have considered.
17. As a user, I want each career path to include a projected timeline, milestones, salary bands, and skill gaps so that paths feel concrete and actionable.
18. As a user, I want paths to include non-obvious options (lateral moves, industry pivots, emerging roles) so that I'm not limited to the obvious trajectory.
19. As a user, I want to activate one path as my primary focus so that all downstream features (gaps, jobs, resume) align to that goal.
20. As a user, I want paths to be regenerated when my profile changes significantly so that the guidance stays current.
21. As a user, I want to see a visual roadmap of my chosen path with decision points so that I can understand where choices will branch my trajectory.
22. As a user, I want salary bands shown at every milestone so that I can evaluate financial progression against timelines.
23. As a user, I want each path to have a confidence score so that I understand how achievable it is given my current profile.

### Skill Gap Analysis
24. As a user, I want to see a prioritised list of skill gaps for my target role so that I know what to do next, ranked by impact on my candidacy.
25. As a user, I want each gap to be classified (missing, outdated, depth insufficient) so that I know what type of action is needed.
26. As a user, I want each gap to include a plain-language recommendation (not "improve your data skills" but a specific action) so that the advice is immediately actionable.
27. As a user, I want the system to recommend the most appropriate learning resource type (course, project, certification, experience) for each gap so that I don't waste time on the wrong approach.
28. As a user, I want to mark a gap as complete so that my profile, employability score, and downstream outputs update automatically.
29. As a user, I want the system to monitor market demand for my target role weekly so that I'm alerted when required skills shift.
30. As a user, I want an alert when a skill I'm actively building is declining in market demand so that I can reprioritise before wasting time.

### Strategic Advisory Chat
31. As a user, I want to bring real career decisions to the platform (offer evaluations, education decisions, promotion assessments) so that I get reasoned guidance, not generic opinions.
32. As a user, I want the advisor to have full context of my profile, chosen path, and skill gaps so that advice is specific to my situation.
33. As a user, I want advice framed as a reasoned perspective (not a directive) with the reasoning surfaced so that I can evaluate it and make my own call.
34. As a user, I want the advisor to express uncertainty when it exists so that I'm not misled by false confidence.
35. As a user on Premium, I want an escalation path to a human advisor for the highest-stakes decisions so that I have a safety net when AI judgment isn't enough.
36. As a user, I want salary negotiation guidance with market data for my exact role/location/seniority so that I negotiate from an informed position.
37. As a user, I want scripts and talking points personalised to my situation so that I can have real conversations, not theoretical ones.
38. As a user, I want conversation history preserved so that I can return to previous advice and build on it.

### Check-ins & Persistent Memory
39. As a user, I want a weekly 3-question pulse check-in so that the system tracks my sentiment without demanding time I don't have.
40. As a user, I want a monthly deep review check-in so that the system has rich signal to detect patterns over time.
41. As a user, I want my profile to update automatically from check-in responses so that I never have to manually update what I've learned or experienced.
42. As a user, I want the system to detect patterns in my check-in responses (creeping dissatisfaction, disengagement) so that I'm warned before things become a crisis.
43. As a user, I want check-in reminders so that I don't have to remember to do them.
44. As a user, I want to see how my engagement and satisfaction have trended over time so that I can recognise when something is wrong.

### Resume Engine
45. As a user, I want a resume generated automatically from my profile so that I'm never starting from scratch.
46. As a user, I want the resume to prioritise and shape content for a specific target role or path so that it's always relevant.
47. As a user, I want a role-specific tailored resume when I apply to a particular job so that my application is competitive for that JD.
48. As a user, I want each generated resume ATS-scored before delivery so that I know it will pass screening.
49. As a user, I want specific, actionable ATS issues (not just a score) so that I know what to fix.
50. As a user, I want plain-language work descriptions converted into strong impact statements so that achievements read as outcomes, not responsibilities.
51. As a user, I want distinct resume versions for each career path I'm exploring so that I don't send a generic document.
52. As a user, I want full resume version history so that I can roll back or compare versions.

### Smart Job Execution
53. As a user, I want a ranked shortlist of roles matched to my long-term goal trajectory (not just current skills) so that I'm moving toward my target, not just finding any job.
54. As a user, I want each role scored on immediate fit, stepping-stone value, strategic alignment, and connection score so that I can evaluate quality, not just volume.
55. As a user, I want a pre-interview brief for each role (company background, culture signals, role context) so that I walk into every conversation prepared.
56. As a user, I want cover letters drafted in my voice with role-specific context so that applications are personalised without being time-consuming.
57. As a user, I want all application outcomes tracked so that the system learns which approaches produce results for me specifically.
58. As a user, I want the job shortlist refreshed when market data changes so that I'm not pursuing stale opportunities.

### Post-Placement Continuity
59. As a user who just started a new role, I want a 30/60/90-day plan so that I enter with a structure rather than improvising.
60. As a user in a role, I want weekly pulse check-ins calibrated to my current situation so that the system tracks engagement in the new context.
61. As a user, I want achievement logging throughout my role so that I'm not scrambling at review time.
62. As a user, I want promotion positioning guidance (timing, evidence, conversations) so that I navigate advancement intentionally.
63. As a user, I want background monitoring for exit signals (skills stagnating, compensation falling below market, company growth plateauing) so that I'm warned before a situation becomes urgent.
64. As a user, I want skills currency monitoring so that I know if my current role is keeping me competitive externally.

---

## Implementation Decisions

### Current State (as of v2.0)

Phase 1 (Foundation) is ~90% complete. The following are **already built and shipped**:
- Better Auth (email/password + Google OAuth)
- Full Profile schema: skills, work history, education, achievements, projects, languages, work authorizations, constraints, learning goals, social links, job applications
- Dashboard metrics pipeline (pulse growth/visibility/progression, activity feed, in-flight applications)
- Rule-based observation engine (dormant skills, overdue goals, unapplied to target role)
- Job and JobApplication models with fit-score and stage tracking

The critical pending item in Phase 1 is **replacing rule-based observations with AI-powered analysis** (`insights.service` has an explicit TODO for this).

---

### Module Design

#### Module 1 — AI Observation Engine (replaces rule-based `insights.service`)

The observation engine is the first AI integration point. It should be a deep module: given a fully-loaded user profile snapshot, it returns a typed list of observations with no side effects. The interface is narrow and stable; the intelligence lives inside.

Input: `UserProfileSnapshot` (profile + skills + work history + goals + applications)  
Output: `Observation[]` where each observation has `{ text, type, confidence, source }`

This module should be callable from both the API (on-demand) and a background job (weekly refresh). The rule-based fallback should remain as the cold-start path until the AI version is validated.

#### Module 2 — Resume Parser

Given raw resume text (extracted from PDF/DOCX), return structured `WorkHistory[]`, `Skill[]`, and `Education[]` matching the existing schema. Claude is the extraction engine. Output must be validated against Zod schemas before persisting — malformed AI output should not corrupt the profile.

This module is isolated: text in, typed structured data out. No DB writes — the caller decides what to persist.

#### Module 3 — Career Path Generator

Given a complete user profile, return 3–5 typed `CareerPath` objects with milestones, salary bands, skill gaps, confidence scores, and projected timelines. Claude is the reasoning engine; market salary data is injected as context.

Paths are generated on-demand and persisted. Regeneration is triggered when profile completeness score changes by >20% or the user explicitly requests it. Stale paths (>90 days) are flagged.

#### Module 4 — Skill Gap Engine

A background-capable module that:
1. Pulls current job listings for the user's target role (via job data API or scraped `Job` records)
2. Extracts required skills/tools/credentials from listings at scale
3. Diffs against the user's `Skill[]` and `LearningGoal[]`
4. Returns a `SkillGap[]` list ranked by `impact_score`

Gap records are persisted to enable tracking over time. Weekly refresh is a BullMQ job. The gap list is the input to the resume engine (which skills to feature) and the job matching module (which gaps matter most for a given role).

#### Module 5 — Advisory Chat Agent

A stateful conversation agent with full profile context injected into every turn. The agent has access to: user profile, active career path, current skill gaps, job applications, and check-in history.

Each conversation is associated with a decision type (offer evaluation, education decision, negotiation, etc.) or free-form. Conversation history is persisted. The agent follows a strict framing protocol: perspective not directive, uncertainty surfaced, reasoning always visible.

Context injection uses prompt caching (Anthropic extended cache) since the user profile is large and doesn't change turn-to-turn.

#### Module 6 — Check-in Engine

Manages the check-in schedule (weekly pulse: 3 questions, 2 min; monthly review: deeper), stores responses, runs sentiment analysis, and triggers profile updates from salient responses. Sentiment is scored -1 to 1 per check-in and trended over time.

The check-in engine is a background job (BullMQ) for scheduling and reminder delivery. The response-to-profile-update logic is its own isolated function: `CheckInResponse[] → ProfileUpdateDelta`.

#### Module 7 — Resume Engine

Given a `UserProfile` and an optional `targetRole` or `CareerPath`, generate a complete formatted resume. The engine:
- Selects and ranks experience based on target
- Runs impact statement generation (plain description → context/action/outcome)  
- Scores output against ATS criteria
- Versions and persists the output

Resume generation and ATS scoring should be independently testable.

#### Module 8 — Job Matching Engine

Given a user profile + active career path + skill gaps, return a ranked shortlist of `Job` records scored on: immediate fit, stepping-stone value, strategic alignment, and connection score. Scoring weights are configurable. This module reads from the `Job` table and produces `JobApplication` candidates.

---

### Schema Decisions

The current schema already captures most required data. Planned additions:

- `CareerPath` model: `{ id, userId, title, confidenceScore, projectedTimelineMonths, milestones (JSON), skillGaps (JSON), isActive, generatedAt }`
- `SkillGap` model: `{ id, profileId, skill, gapType, marketDemand, impactScore, recommendation, resource (JSON), status, detectedAt, closedAt }`
- `CheckIn` model: `{ id, userId, type, responses (JSON), sentimentScore, aiObservations (JSON), actionItems (JSON), createdAt }`
- `Conversation` model: `{ id, userId, decisionType, messages (JSON), createdAt, updatedAt }`
- `Resume` model: `{ id, profileId, careerPathId?, targetRole?, version, content (JSON), atsScore, atsIssues (JSON), createdAt }`

The `aspirations` and `values` JSON columns on `Profile` remain as-is (camelCase, Zod-validated on write).

---

### API Contract Additions

All new routes follow the existing `/api/v1` prefix with Better Auth session middleware.

**Career Paths**
- `GET /paths` — list generated paths for user
- `POST /paths/generate` — trigger path generation
- `PUT /paths/:id/activate` — set active path

**Skill Gaps**
- `GET /gaps` — prioritised gap list
- `POST /gaps/refresh` — re-run gap analysis
- `POST /gaps/:id/complete` — mark gap closed, trigger profile sync

**Advisory Chat**
- `POST /chat` — send message to career advisor
- `GET /chat/history` — paginated conversation history
- `POST /chat/decision` — structured decision support with decision type context

**Check-ins**
- `GET /checkins/next` — next scheduled check-in prompt
- `POST /checkins` — submit check-in response
- `GET /checkins` — check-in history with sentiment trend

**Resume**
- `POST /resumes/generate` — generate from profile
- `POST /resumes/tailor` — tailor to a specific JD
- `GET /resumes/:id/ats-score` — ATS score and issues

**Jobs**
- `GET /jobs` — ranked shortlist
- `POST /jobs/refresh` — refresh shortlist from market data

---

### AI Integration Decisions

- **Model:** Claude Sonnet 4.6 for generation tasks (path generation, gap analysis, observations, chat). Claude Haiku 4.5 for high-frequency classification tasks (sentiment scoring, ATS keyword matching).
- **Prompt caching:** Applied to all turns in the advisory chat (user profile context injected at the top of every conversation and cached).
- **Structured output:** All AI generation tasks validate output against Zod schemas before persisting. Malformed output triggers a retry with an explicit correction prompt, not a silent failure.
- **Fallback:** Rule-based logic (current `insights.service`) remains as the cold-start fallback when AI output fails validation after retries.

---

### Build Phase Sequence

| Phase | What ships | Key deliverable |
|---|---|---|
| 1 (done) | Auth, profile, dashboard, rule-based observations | User leaves session one with a populated profile |
| 1.5 (next) | AI observation engine replaces rule-based insights | Observations are specific to the user, not templates |
| 2 | Career path generation + visual roadmap | User sees 3 realistic paths with salary and timeline |
| 3 | Skill gap engine + weekly market monitoring | User has a prioritised, specific action list |
| 4 | Check-in engine + sentiment tracking | Platform learns from the user over time |
| 5 | Advisory chat with full profile context | User brings real decisions to the platform |
| 6 | Resume engine + ATS scoring | Tailored, ATS-optimised resume in <60 seconds |
| 7 | Job matching + application intelligence | User executes strategically, not at volume |
| 8 | Post-placement continuity | Platform stays relevant after the job is landed |

---

## Testing Decisions

**What makes a good test:** Tests should verify the observable contract of a module — inputs in, outputs out — without asserting on internal implementation. A test that breaks when you refactor internals without changing behaviour is a bad test.

**Modules with testable interfaces (prioritised):**

1. **Resume Parser** — text in, structured `WorkHistory[]`/`Skill[]`/`Education[]` out. Golden-file tests with a set of representative resume fixtures covering edge cases (gaps, non-linear careers, contract work, international formats).

2. **Skill Gap Engine (diff step)** — profile skills + market required skills in, `SkillGap[]` out. Pure function, no DB or AI calls. Fast unit tests covering gap types and ranking logic.

3. **AI Observation Engine** — profile snapshot in, `Observation[]` out. Integration test against the real Claude API with a canned profile; assert that output conforms to the `Observation` schema and passes a specificity check (no observation text should be generalisable to all users).

4. **Check-in Response → Profile Update Delta** — `CheckInResponse[]` in, `ProfileUpdateDelta` out. Pure function. Unit tests covering each response type that should trigger a profile field update.

5. **ATS Scoring** — `ResumeContent` + `targetRole` in, `{ score, issues }` out. Unit tests covering known ATS failure patterns (missing keywords, passive language, formatting issues).

6. **Dashboard Compute** — snapshot data in, `DashboardMetrics` out. The existing `dashboard.compute.ts` is already a pure function; add unit tests with canned data snapshots.

**Prior art in codebase:** `dashboard.compute.ts` is the established pattern for a pure compute function — isolated from DB, takes a typed snapshot, returns typed output. All new compute-heavy modules should follow this pattern.

**Integration tests:** Use a real Neon test database (not mocked). The existing Prisma seed files (`seed.ts`, `seed-dashboard.ts`) provide the pattern for seeding test state.

---

## Out of Scope

- **Auto-applying to jobs on behalf of the user.** The platform supports strategic execution, not automation.
- **Recruiter-facing features.** This platform serves candidates only.
- **Aggregating or listing jobs as a primary product surface.** Jobs are matched and ranked; we are not a job board.
- **LinkedIn OAuth integration or automated LinkedIn profile reading.** LinkedIn optimisation guidance is in scope; direct API access is not (post-MVP).
- **Human advisor marketplace.** The Premium escalation path is an out-of-band referral for Phase 5+, not a built feature in MVP.
- **Layer 5 (Personal Brand Management).** Explicitly deferred per PRD v1.0 — LinkedIn scoring and portfolio positioning are post-MVP.
- **Interview simulation.** High-value post-MVP addition; not in the MVP build sequence.
- **Peer benchmarking.** Post-MVP.

---

## Further Notes

**The profile is the product.** Every engineering and design decision should be evaluated against whether it enriches or degrades the profile model. A feature that doesn't deepen the profile is a feature that weakens the moat.

**Specificity is the quality bar.** An AI response that could have been given to any user is a failure state. Every observation, path, gap recommendation, and advisory response must be evaluated against this bar. The test: could this exact text appear on another user's screen unchanged? If yes, it needs to be reworked.

**Cold start is the critical UX risk.** The platform's value compounds over time, but users decide in session one whether to return. The onboarding flow must deliver one clear, specific, useful insight before asking the user to do more work. This is not a nice-to-have — it is the retention mechanism.

**Privacy architecture must be designed now.** Users will store undisclosed job search activity and career dissatisfaction. The data model and access controls must treat this data with the same care as health records. No third-party data selling, ever. User-facing privacy controls (what is stored, how it's used, how to delete) must ship before any public launch.

**Phase gating is mandatory.** Each phase ships a working, valuable deliverable before the next begins. The risk is building a wide, shallow version of all 8 layers. The mitigation is strict phase gating: would a real user get genuine value from this phase alone?
