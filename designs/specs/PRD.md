# Product Requirements Document — AI Career Advisor Agent

**Version:** 1.0  
**Status:** Active  
**Author:** Shreeraj  
**Last Updated:** May 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [Target Users](#4-target-users)
5. [Core Design Principles](#5-core-design-principles)
6. [System Architecture Overview](#6-system-architecture-overview)
7. [Feature Specifications](#7-feature-specifications)
   - [Layer 1 — Deep User Profiling](#layer-1--deep-user-profiling)
   - [Layer 2 — Career Path Intelligence](#layer-2--career-path-intelligence)
   - [Layer 3 — Skill Gap Analysis](#layer-3--skill-gap-analysis)
   - [Layer 4 — Strategic Advisory](#layer-4--strategic-advisory)
   - [Layer 5 — Personal Brand Management](#layer-5--personal-brand-management)
   - [Layer 6 — Resume Engine](#layer-6--resume-engine)
   - [Layer 7 — Smart Job Execution](#layer-7--smart-job-execution)
   - [Layer 8 — Post-Placement Continuity](#layer-8--post-placement-continuity)
8. [Data Models](#8-data-models)
9. [API Design](#9-api-design)
10. [MVP Build Sequence](#10-mvp-build-sequence)
11. [Future Features (Post-MVP)](#11-future-features-post-mvp)
12. [Business Model](#12-business-model)
13. [Competitive Positioning](#13-competitive-positioning)
14. [Risks and Mitigations](#14-risks-and-mitigations)
15. [Success Metrics](#15-success-metrics)

---

## 1. Product Overview

An AI-powered career management platform that acts as a persistent personal career strategist. Unlike transactional tools (job boards, resume builders, one-off coaches), this platform builds a deep, evolving model of the user's professional identity over time and uses it to deliver personalised, strategic career guidance — continuously, not just during job searches.

**Core value proposition:** Most people react to their careers. This platform helps them build one with intention.

**One-line pitch:** "Your AI career advisor that gets smarter the longer you use it."

---

## 2. Problem Statement

Most professionals face the following compounding problems:

- They only think about career development reactively (job loss, burnout, missed promotion)
- They use 5+ disconnected tools (LinkedIn, job boards, resume builders, salary sites, coaches) that don't talk to each other
- They apply to roles without understanding their real fit or market positioning
- They don't know which skills to prioritise or in what order
- Quality career coaching is unaffordable for most people ($200–500/hr)
- They miss opportunities because they weren't paying attention at the right time

The result is a career that drifts rather than one built with intention.

---

## 3. Goals and Non-Goals

### Goals

- Build a persistent, evolving model of each user's professional identity
- Surface the specific gap between where a user is and where they want to be
- Deliver clear, actionable, personalised guidance — not generic advice
- Provide continuity across the full career lifecycle (not just job hunting)
- Make career coaching quality accessible at a fraction of the cost of a human coach

### Non-Goals

- This is **not** a job board — we do not aggregate or list jobs as a primary feature
- This is **not** an application bot — we do not auto-apply to roles on the user's behalf
- This is **not** a CV formatter — resume generation is a downstream output, not the product
- This is **not** a recruiter tool — the platform serves candidates only, never hiring managers
- This does **not** replace human coaches for high-stakes, nuanced decisions — it escalates to them

---

## 4. Target Users

### Primary User: Early-to-Mid Career Professional

- Age: 22–35
- Actively employed but career-aware
- Has some professional history (1–8 years experience)
- Wants to grow intentionally but lacks structure or guidance
- Cannot afford a personal coach
- Frustration: "I know I should be doing more with my career but I don't know where to start"

### Secondary User: Active Job Seeker

- Between roles or actively looking
- Needs targeted execution support: resume tailoring, role matching, interview prep
- High urgency, short time horizon
- Success metric: land the right role faster with better targeting

### Tertiary User: Career Pivoter

- Looking to transition industries, roles, or seniority levels
- Needs honest assessment of transferable skills and gap analysis
- High ambiguity, needs clarity above all else

### Quaternary User: Student / New Graduate

- Currently studying or recently graduated
- Looking for internships, co-ops, or entry-level positions
- Needs help translating academic experience to industry requirements
- Success metric: Land a high-quality internship or first full-time role

---

## 5. Core Design Principles

These principles govern every product and engineering decision:

1. **Depth over breadth** — A mediocre career advisor is worse than no advisor. Ship fewer features with genuine intelligence rather than many shallow ones.

2. **Earned trust** — Users will make life-altering decisions based on what this system tells them. Every recommendation must be traceable, reasoned, and framed as a perspective — never a directive.

3. **The profile is the product** — Every feature is only as good as the user's profile. Onboarding, check-ins, and every interaction should advance the quality of the profile model.

4. **Persistent memory is the moat** — The longer the user stays, the more valuable the platform becomes. Continuity is the core competitive differentiator.

5. **Plain language always** — Advice is worthless if it isn't understood. No jargon, no hedged corporate language. Tell the user what they need to hear.

6. **Privacy by design** — Users will share career anxieties, salary dissatisfaction, and undisclosed job search activity. This data must be treated with the same care as medical records.

---

## 6. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│         Next.js (App Router) or TanStack                │
│   Profile UI · Path Map · Chat · Resume Editor          │
└────────────────────┬────────────────────────────────────┘
                     │ REST / WebSocket
┌────────────────────▼────────────────────────────────────┐
│                   Express API Server                     │
│                  (Node.js + TypeScript)                  │
│                                                         │
│  Auth Middleware · Rate Limiting · Job Queue            │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼────────────────────┐
│  Neon DB    │ │  AI Layer  │ │   External Integrations  │
│  Postgres   │ │ Anthropic  │ │  LinkedIn · Job APIs     │
│  Prisma     │ │ Claude API │ │  Salary Data · ATS       │
│             │ │            │ │                          │
└─────────────┘ └────────────┘ └──────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS + Shadcn UI |
| Backend | Node.js + Express + TypeScript |
| Database | Neon Serverless (PostgreSQL) + Prisma ORM |
| Auth | Better Auth (self-hosted, Prisma adapter) |
| AI | Anthropic Claude API (primary reasoning and generation) |
| Job Queue | BullMQ (background jobs: check-ins, market monitoring, alerts) |
| Search | Typesense or equivalent (for job/skill search) |
| Deployment | Railway (monorepo, both apps) |
| Repo Structure | Monorepo (Turborepo + pnpm workspaces) |

### Monorepo Structure

```
/
├── apps/
│   ├── web/              # Next.js frontend
│   └── server/           # Express API backend
├── packages/
│   ├── auth/             # Better Auth configuration
│   ├── config/           # Shared TypeScript/ESLint configurations
│   ├── db/               # Prisma ORM, schema, and Neon database client
│   ├── env/              # Environment variables and validation (t3-env)
│   └── ui/               # Shared UI components (Tailwind/Shadcn)
├── turbo.json
└── package.json
```

---

## 7. Feature Specifications

---

### Layer 1 — Deep User Profiling

**Purpose:** Build the foundational model of the user. Every downstream feature depends on the quality of this layer.

#### 1.1 Skills Intelligence

**Data captured:**
- Hard skills: tools, languages, frameworks, certifications, platforms
- Soft skills: leadership, communication, analytical, creative
- Per-skill metadata:
  - `confidence_level`: 1–5 (depth score, not binary)
  - `recency`: actively used / dormant / historical
  - `last_used_date`
  - `source`: self-reported / inferred from resume / inferred from job history

**Behaviour:**
- Profile updates automatically when the user logs new experience or completes a learning milestone
- Dormant skills (unused > 18 months) are flagged distinctly from active skills
- Skill confidence is re-assessed during monthly check-ins

#### 1.2 Work History Analysis

**Input sources:** Resume upload (PDF/DOCX parsing), LinkedIn import, manual entry

**Extracted signals:**
- Career trajectory classification: `linear` | `accelerating` | `stagnating` | `pivoting`
- Industry exposure history with duration
- Company size history (startup / scale-up / enterprise / public)
- Team structure experience (IC / lead / manager / director)
- Distinction between responsibilities held vs. outcomes delivered

**Implementation note:** Use Claude to extract structured data from raw resume text. Output a typed JSON object matching the `WorkHistory` schema.

#### 1.3 Values and Preferences

**Captured via onboarding questionnaire + ongoing check-ins:**

- Work environment preference: `startup` | `corporate` | `remote` | `hybrid`
- Risk appetite: `stability_seeking` | `balanced` | `high_growth`
- Salary expectations with location benchmarking
- Geographic and lifestyle constraints
- Working style preferences (async/sync, autonomy level, team size)

#### 1.4 Aspirations Layer

- Target roles and industries (3-year and 5-year horizon)
- Problem spaces that excite the user
- Definition of success (not just title/salary — meaning, impact, lifestyle)
- Updated during check-ins; versioned so trajectory shifts are visible over time

---

### Layer 2 — Career Path Intelligence

**Purpose:** Given a complete user profile, generate the realistic paths forward and visualise them.

#### 2.1 Path Generation

- Generate 3–5 distinct career paths per user based on full profile
- Each path includes:
  - Projected timeline to reach target
  - Required milestones (ordered)
  - Skill gaps to close per milestone
  - Salary progression per milestone (benchmarked by location + industry)
  - Confidence score (how achievable based on current profile)
- Include non-obvious paths: lateral moves, industry pivots, emerging roles
- Paths are regenerated when the user's profile or market data changes significantly

#### 2.2 Path Visualisation

- Interactive roadmap: current position → decision points → milestones → target
- Decision points flagged where user choices will branch trajectory
- Progress tracked against chosen milestones
- Salary bands shown at every milestone on every path

#### 2.3 Opportunity Radar

- Proactively surfaces emerging roles aligned to target path before they become mainstream
- Alerts when target companies post roles matching the user's goal trajectory
- Tracks industry-level shifts in demand for skills relevant to the user

#### 2.4 Market Reality Layer

- Salary bands by role, seniority, and geography (live data)
- Demand trend for current and target skills: `rising` | `stable` | `declining`
- Honest assessment of role/industry trajectory

---

### Layer 3 — Skill Gap Analysis

**Purpose:** This is the core intelligence of the platform. Identify precisely what is standing between the user and their target role, and tell them what to do about it.

#### 3.1 Market-Aligned Gap Detection

**Process:**
1. Continuously pull and analyse current job listings for the user's target role
2. Extract skills, tools, experience, and credentials that consistently appear
3. Compare against the user's current profile
4. Output: prioritised gap list ranked by impact on employability (not alphabetical)

**Output format per gap:**
```typescript
{
  skill: string,
  gap_type: "missing" | "outdated" | "depth_insufficient",
  market_demand: "high" | "medium" | "low",
  impact_score: number,       // 1–10: how much closing this gap improves candidacy
  recommendation: string,     // Plain-language action
  resource?: {
    type: "course" | "certification" | "project" | "experience",
    name: string,
    estimated_time: string
  }
}
```

#### 3.2 Plain-Language Recommendations

- Specific, not generic: not "improve your data skills" but "learning SQL to a working level would make you eligible for a significantly larger set of roles in your target area"
- One recommendation per gap, not a list — the most appropriate option for that specific user
- Clearly state when a gap is better closed through experience vs. study

#### 3.3 Profile Sync on Completion

- When user marks a learning complete, earns a credential, or logs new experience → profile updates
- Gap is marked closed, overall employability score refreshed
- All downstream outputs (resume, job match, advice) reflect updated profile

#### 3.4 Ongoing Market Monitoring (Background Job)

- Scheduled job (weekly) re-analyses market demand for user's target role
- Alerts user when:
  - A previously optional skill is now appearing in >50% of listings
  - A skill the user is actively building is declining in demand
  - A new tool or technology is emerging in their target space

---

### Layer 4 — Strategic Advisory

**Purpose:** The career coach layer. Help the user think clearly through high-stakes decisions.

#### 4.1 Career Decision Chat

**Supported decision types:**
- Evaluating and comparing job offers
- Deciding whether further education is worth it
- Assessing whether a promotion is worth staying for
- Understanding industry trajectory (decline vs. temporary dip)
- Deciding when to move vs. when to stay and build
- Handling difficult workplace situations

**Design rules for this feature:**
- Always frame advice as a reasoned perspective, never a directive
- Surface the reasoning so the user can evaluate it
- Express uncertainty where it exists
- For Premium tier: offer escalation path to human advisor for highest-stakes decisions

#### 4.2 Salary Negotiation Intelligence

- Market data for the user's exact profile: role + seniority + location + industry
- Framing and timing guidance for negotiation conversations
- What to negotiate beyond base: equity, flexibility, growth trajectory, signing bonus
- Scripts and talking points personalised to the user's situation

#### 4.3 Network Strategy

- Identifies types of people the user needs to know to reach their target path
- Guidance on authentic outreach and relationship building
- Surfaces mutual connections to target companies

---

### Layer 5 — Personal Brand Management

**Purpose:** Being found is as important as applying. Manage the user's professional visibility.

#### 5.1 LinkedIn Optimisation

- Profile scoring against target role requirements
- Keyword gap analysis between current profile and target role listings
- Content strategy recommendations to build visibility and credibility
- Profile performance tracked as a background signal (view rate, connection growth)

#### 5.2 Portfolio and GitHub Positioning

- Guidance on what to showcase based on target role
- Project presentation coaching: structure, documentation, framing
- Regular prompts to keep portfolio current as profile evolves

---

### Layer 6 — Resume Engine

**Purpose:** The resume is not a document the user maintains — it is a live output of the system's knowledge of them.

#### 6.1 Living Resume Profile

- Master career record maintained in the background at all times
- Auto-updates when user logs new experiences, completions, or certifications
- User never needs to "update their resume" — the data is always current

#### 6.2 Resume Autogeneration

- At any point, user can generate a complete, formatted resume from stored profile
- System selects and prioritises experience based on the chosen target role or path
- Achievements generated in strong, active language (not just raw inputs)
- User can specify a target role; resume is shaped accordingly

#### 6.3 Role-Specific Tailoring

- When user applies to a specific role, resume is tailored to that JD
- Keywords from job posting mapped against profile and incorporated naturally
- Relevant experience elevated; less relevant content deprioritised
- User receives explanation of what changed and why

#### 6.4 ATS Optimisation

- Every generated resume scored against ATS criteria before delivery
- Checks: formatting issues, missing keywords, weak phrasing, structural problems
- Output: specific, actionable suggestions (not just a score)

#### 6.5 Impact Statement Generator

- User inputs plain-language description of work done
- System generates structured impact statement: context → action → outcome
- Example: "worked on the checkout flow" → "Redesigned end-to-end checkout experience, reducing drop-off by 22% and contributing to a 15% increase in completed purchases"
- User reviews and edits; system does the heavy lifting

#### 6.6 Resume Versioning

- Distinct resume versions maintained per career path the user is exploring
- Full version history stored
- Resume health monitoring: flags when resume is outdated relative to actual experience

---

### Layer 7 — Smart Job Execution

**Purpose:** When the user is ready to move, execute strategically — not at volume.

#### 7.1 Strategic Role Targeting

- Roles matched to long-term goal trajectory, not just current skills
- Ranked shortlist (quality > volume)
- Roles scored on:
  - Immediate fit (current skills vs. JD)
  - Stepping-stone value (does this move the user toward their target path?)
  - Strategic alignment (goals, values, work environment preferences)
  - Connection score (does user have a warm contact at this company?)

#### 7.2 Application Intelligence

- Resume tailored per role in seconds
- Cover letter drafted in the user's voice with role-specific context
- Pre-interview brief: company background, role context, culture signals

#### 7.3 Application Tracking and Learning

- Every application outcome tracked
- System identifies patterns: which role types, company stages, and approaches produce results
- Strategy adjusted over time based on outcome data

---

### Layer 8 — Post-Placement Continuity

**Purpose:** The job landing is not the end — it is the beginning of the next chapter. Most platforms stop here. This one does not.

#### 8.1 Role Onboarding Support

- 30/60/90-day plan generated based on role and user profile
- Guidance on establishing credibility, building key relationships, understanding internal landscape
- Early milestones set so user enters with a plan

#### 8.2 Job Sentiment Check-ins

- Scheduled check-ins (weekly lightweight pulse + monthly deep review)
- Tracks over time: engagement level, satisfaction with growth, management relationship, values alignment
- Identifies patterns: creeping dissatisfaction, gradual disengagement — surfaced before they become crises

#### 8.3 Performance and Progression Tracking

- Ongoing achievement logging so user is never scrambling at review time
- Growth tracked against path milestones
- Promotion positioning guidance: timing, evidence to present, conversations to initiate

#### 8.4 Skills Currency Monitoring

- Monitors whether skills being built in current role keep the user competitive externally
- Alerts when market is moving in a direction the current role doesn't expose
- Recommends ways to stay current without leaving: side projects, courses, internal opportunities

#### 8.5 Early Warning Signals

- Background monitoring for objective exit signals:
  - Company growth has plateaued
  - User's skills are not being stretched
  - Compensation has fallen below market rate
  - Industry is contracting
- Raised proactively — not waiting for the user to ask

---

## 8. Data Models

### User Profile

```typescript
interface UserProfile {
  id: string
  created_at: Date
  updated_at: Date

  // Identity
  name: string
  email: string
  location: { city: string; country: string; timezone: string }

  // Skills
  skills: Skill[]

  // Work history
  work_history: WorkExperience[]
  career_trajectory: "linear" | "accelerating" | "stagnating" | "pivoting"

  // Preferences
  preferences: {
    work_environment: "startup" | "corporate" | "remote" | "hybrid"
    risk_appetite: "stability_seeking" | "balanced" | "high_growth"
    team_size_preference: "small" | "medium" | "large" | "any"
  }

  // Aspirations
  target_roles: string[]
  target_industries: string[]
  career_goals: { three_year: string; five_year: string }
  success_definition: string

  // Constraints
  salary_expectation: { min: number; max: number; currency: string }
  geographic_constraints: string[]
}

interface Skill {
  name: string
  category: "technical" | "soft" | "domain" | "certification"
  confidence_level: 1 | 2 | 3 | 4 | 5
  recency: "active" | "dormant" | "historical"
  last_used_date?: Date
  source: "self_reported" | "resume_inferred" | "job_history_inferred"
}

interface WorkExperience {
  company: string
  company_size: "startup" | "scale_up" | "enterprise" | "public"
  role_title: string
  industry: string
  start_date: Date
  end_date?: Date
  is_current: boolean
  responsibilities: string[]
  outcomes: string[]           // What was delivered, not just done
  skills_used: string[]
  team_structure: "ic" | "lead" | "manager" | "director"
}
```

### Career Path

```typescript
interface CareerPath {
  id: string
  user_id: string
  generated_at: Date
  is_active: boolean

  title: string                 // e.g. "Senior Product Manager at a Series B"
  description: string
  confidence_score: number      // 0–1, how achievable based on profile
  projected_timeline_months: number

  milestones: Milestone[]
  skill_gaps: SkillGap[]
}

interface Milestone {
  order: number
  title: string
  description: string
  estimated_date: Date
  salary_band: { min: number; max: number; currency: string }
  required_skills: string[]
  status: "not_started" | "in_progress" | "completed"
}

interface SkillGap {
  skill: string
  gap_type: "missing" | "outdated" | "depth_insufficient"
  market_demand: "high" | "medium" | "low"
  impact_score: number
  recommendation: string
  resource?: {
    type: "course" | "certification" | "project" | "experience"
    name: string
    url?: string
    estimated_time: string
  }
}
```

### Resume

```typescript
interface Resume {
  id: string
  user_id: string
  career_path_id?: string      // Which path this resume is tailored for
  target_role?: string         // Specific role if tailored for an application
  version: number
  created_at: Date

  content: ResumeContent
  ats_score: number
  ats_issues: ATSIssue[]
}

interface ResumeContent {
  summary: string
  experience: ResumeExperience[]
  skills: string[]
  education: Education[]
  certifications: Certification[]
  projects?: Project[]
}
```

### Check-in

```typescript
interface CheckIn {
  id: string
  user_id: string
  type: "weekly_pulse" | "monthly_review"
  created_at: Date

  responses: CheckInResponse[]
  sentiment_score: number       // -1 to 1
  ai_observations: string[]     // Patterns identified by the agent
  action_items: string[]
}
```

---

## 9. API Design

All routes are prefixed with `/api/v1`. Authentication via Better Auth session token in header.

### Profile

```
GET    /profile                    — Get full user profile
PUT    /profile                    — Update profile fields
POST   /profile/resume/parse       — Upload and parse resume (PDF/DOCX)
POST   /profile/skills             — Add or update a skill
DELETE /profile/skills/:skillId    — Remove a skill
POST   /profile/experience         — Add work experience
PUT    /profile/experience/:id     — Update work experience
```

### Career Paths

```
GET    /paths                      — Get all generated paths for user
POST   /paths/generate             — Trigger path regeneration
GET    /paths/:id                  — Get specific path with milestones
PUT    /paths/:id/activate         — Set as active path
POST   /paths/:id/milestones/:mid  — Update milestone status
```

### Skill Gaps

```
GET    /gaps                       — Get current prioritised gap list
POST   /gaps/refresh               — Re-run gap analysis against latest market data
POST   /gaps/:id/complete          — Mark a gap as closed (triggers profile update)
```

### Resume

```
GET    /resumes                    — List all resume versions
POST   /resumes/generate           — Generate resume from profile
POST   /resumes/tailor             — Tailor existing resume to a specific JD
GET    /resumes/:id                — Get specific resume
GET    /resumes/:id/ats-score      — Get ATS score and issues
```

### Advisory (Chat)

```
POST   /chat                       — Send message to career advisor agent
GET    /chat/history               — Get conversation history
POST   /chat/decision              — Structured decision support request
```

### Check-ins

```
GET    /checkins                   — Get check-in history
POST   /checkins                   — Submit a check-in response
GET    /checkins/next              — Get next scheduled check-in prompt
```

### Jobs

```
GET    /jobs                       — Get current shortlist
POST   /jobs/refresh               — Refresh job shortlist from market data
GET    /jobs/:id                   — Get role detail with fit analysis
POST   /jobs/:id/apply             — Track application start
PUT    /jobs/:id/outcome           — Log application outcome
```

---

## 10. MVP Build Sequence

Build in this order. Each phase must be solid before moving to the next — depth over coverage.

### Phase 1 — Foundation (Weeks 1–4)

**Goal:** A user can build a meaningful profile and see something genuinely useful.

- [ ] Auth (Better Auth: email/password + Google OAuth)
- [ ] User profile builder: skills, work history, preferences, goals
- [ ] Resume parser (PDF upload → Claude extracts structured profile data)
- [ ] Basic profile completeness scoring
- [ ] Onboarding flow: guide user to minimum viable profile in first session
- [ ] **Deliverable:** User leaves first session with a populated profile and one clear observation about their positioning

### Phase 2 — Path Intelligence (Weeks 5–8)

**Goal:** User can see where they can go.

- [ ] Career path generation (Claude + profile → 3 paths with milestones)
- [ ] Path visualisation (interactive roadmap component)
- [ ] Salary band display on each milestone
- [ ] Path selection and activation
- [ ] **Deliverable:** User sees 3 realistic, personalised paths with salary and timeline data

### Phase 3 — Skill Gap Engine (Weeks 9–12)

**Goal:** User knows exactly what to do next.

- [ ] Job listing ingestion and analysis (target role market data)
- [ ] Gap detection algorithm (profile vs. market demand)
- [ ] Impact-ranked gap list with plain-language recommendations
- [ ] Gap completion tracking and profile sync
- [ ] Background monitoring job (weekly market re-analysis)
- [ ] **Deliverable:** User gets a prioritised, specific action list to improve their candidacy

### Phase 4 — Persistent Memory Loop (Weeks 13–16)

**Goal:** The platform gets smarter over time.

- [ ] Weekly pulse check-in (3 questions, 2 minutes)
- [ ] Monthly deep review check-in
- [ ] Sentiment tracking and pattern detection
- [ ] Profile auto-update from check-in responses
- [ ] Check-in reminder notifications
- [ ] **Deliverable:** The system knows the user better after 4 weeks than it did on day one

### Phase 5 — Advisory Chat (Weeks 17–20)

**Goal:** User can bring real decisions to the platform.

- [ ] Career decision chat interface
- [ ] Context injection: chat agent has full access to user profile + path + gaps
- [ ] Structured decision support templates (offer comparison, education decision, etc.)
- [ ] Conversation history and continuity
- [ ] **Deliverable:** User can have a 10-minute career conversation that gives them a clear, reasoned recommendation

### Phase 6 — Resume Engine (Weeks 21–24)

**Goal:** Resume is always ready, always relevant.

- [ ] Living resume profile (auto-updated from user profile)
- [ ] Resume generation from profile
- [ ] Role-specific tailoring (JD input → tailored resume output)
- [ ] ATS scoring and issue surfacing
- [ ] Impact statement generator
- [ ] Resume versioning
- [ ] **Deliverable:** User generates a tailored, ATS-optimised resume in under 60 seconds

### Phase 7 — Job Execution and Brand (Weeks 25–30)

- [ ] LinkedIn optimisation scoring
- [ ] Keyword gap analysis for LinkedIn
- [ ] Strategic job shortlist (fit + stepping-stone + connection score)
- [ ] Application tracking and outcome logging
- [ ] Cover letter generation
- [ ] Pre-interview brief

### Phase 8 — Post-Placement (Weeks 31–36)

- [ ] 30/60/90-day onboarding plan generation
- [ ] Post-placement check-in mode (different cadence and questions)
- [ ] Achievement logging for review preparation
- [ ] Skills currency monitoring
- [ ] Early warning signal detection

---

## 11. Future Features (Post-MVP)

These are high-value additions identified for post-MVP. None are required for initial launch.

| Feature | Value | Complexity | Priority |
|---|---|---|---|
| Weekly Career Digest | Keeps platform present without app opens | Medium | High |
| Interview Simulation | High retention at most critical moment | High | High |
| Company Intelligence Profiles | Turns every application into an informed decision | High | Medium |
| Career Risk Monitor | Employed users stay engaged without job hunting | Medium | High |
| Peer Benchmarking | Adds market reality layer beyond agent advice | Medium | Medium |
| Accountability System | Converts advice into action | Low | High |
| Exit / Transition Debrief | Deepens long-term profile model | Low | Medium |
| Warm Connection Surfacing | Highest-converting application channel | High | Medium |
| Skills Decay + Reactivation | Prevents critical skills from eroding silently | Low | Medium |

---

## 12. Business Model

| Plan | Price | Included |
|---|---|---|
| **Free** | $0/month | Career profile builder, basic path mapping (1 path), limited check-ins (monthly only) |
| **Pro** | $20/month | Full path intelligence, skill gap engine, smart job execution, resume autogeneration, brand management, weekly check-ins |
| **Premium** | $50/month | Everything in Pro + advisory chat (unlimited), salary negotiation support, interview coaching, human advisor escalation |

**Monetisation principle:** Free tier must deliver genuine value (not a crippled demo). The goal is to make the user's profile rich enough that they see what they're missing without Pro — not to gate core functionality behind a paywall.

---

## 13. Competitive Positioning

| Capability | This Platform | Jobright | LinkedIn | Teal | Pathrise |
|---|---|---|---|---|---|
| Persistent memory and learning | ✅ | ❌ | ❌ | ❌ | ❌ |
| Long-term career strategy | ✅ | ❌ | ❌ | ❌ | Partial |
| Skill gap and growth roadmap | ✅ | ❌ | ❌ | ❌ | ✅ |
| Career path mapping | ✅ | ❌ | ❌ | ❌ | ❌ |
| Strategic advisory and decisions | ✅ | ❌ | ❌ | ❌ | Partial |
| Personal brand management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Resume autogeneration and tailoring | ✅ | Partial | ❌ | Partial | ❌ |
| Smart job execution | ✅ | ✅ | ❌ | ❌ | ❌ |
| Post-placement continuity | ✅ | ❌ | ❌ | ❌ | ❌ |
| Affordable and scalable | ✅ | ✅ | ✅ | ✅ | ❌ |

**Against Jobright:** Jobright helps you find a job. This platform helps you build a career.  
**Against LinkedIn:** LinkedIn shows you what is available. This platform tells you what is possible for you specifically.  
**Against Pathrise:** Pathrise charges thousands and uses human coaches. This platform gives everyone access to the same quality of strategic thinking at a fraction of the cost.

---

## 14. Risks and Mitigations

### Risk 1 — Scope Creep / Shallow Build

**Risk:** Building a wide, shallow version of all 8 layers rather than a deep, excellent version of the most important ones.  
**Mitigation:** Strict phase gating. Each phase ships with a clear deliverable that must be validated before proceeding. The test: would a real user get genuine value from this phase alone?

### Risk 2 — Advisory Quality and Liability

**Risk:** The career decision support feature carries real-world consequences. Poor advice about job offers, career moves, or education investments can cause harm.  
**Mitigation:** All advice framed as reasoned perspective, not directive. Reasoning always surfaced. Uncertainty expressed where it exists. Premium tier has escalation path to human advisor. Legal review of advisory copy before launch.

### Risk 3 — Cold Start Problem

**Risk:** The product is most valuable after months of use. Users who don't see value in session one won't return.  
**Mitigation:** Onboarding flow engineered to deliver one clear, useful, specific insight before asking the user to do more work. First session must feel like talking to someone who actually knows about careers — not filling out a form.

### Risk 4 — Data Sensitivity and Trust

**Risk:** Users will store undisclosed job search activity, salary anxieties, and career dissatisfaction. A breach or misuse destroys trust permanently.  
**Mitigation:** Data privacy architecture designed from day one. Clear user-facing privacy controls: what is stored, how it is used, who can access it, how to delete it. No third-party data selling, ever. Privacy policy written in plain language.

### Risk 5 — Agent Voice Degradation

**Risk:** Generic AI responses undermine trust. If the agent sounds like a chatbot rather than a knowledgeable advisor who actually knows the user, the product fails.  
**Mitigation:** Every AI prompt template is written with full user profile context injected. Agent responses are evaluated for specificity — a response that could have been given to anyone is a failure state. Regular qualitative review of conversation samples.

---

## 15. Success Metrics

### North Star Metric

**Weekly Active Users who completed a profile action or check-in** — measures whether the platform is delivering on its core promise of ongoing engagement, not just sign-up.

### Phase-Specific Metrics

| Phase | Key Metric | Target |
|---|---|---|
| Phase 1 (Profiling) | % of users who complete onboarding with a full profile | >60% |
| Phase 2 (Paths) | % of users who activate a career path | >50% |
| Phase 3 (Gaps) | % of users who mark at least one gap complete within 30 days | >30% |
| Phase 4 (Memory) | 30-day retention rate | >40% |
| Phase 5 (Advisory) | Average chat session length (proxy for value delivered) | >8 minutes |
| Phase 6 (Resume) | % of generated resumes downloaded | >70% |

### Health Metrics

- Day 7 retention
- Day 30 retention
- Profile completeness score (average across all users)
- Monthly check-in completion rate
- Free → Pro conversion rate (target: >8%)
- Pro churn rate (target: <5% monthly)

### Quality Signals

- User-reported helpfulness rating on advisory responses (in-chat thumbs up/down)
- Resume ATS score improvement between version 1 and version 2
- Job application outcome rate (interviews secured / applications sent)

---

*This document is the authoritative source of truth for product requirements. All engineering and design decisions should be evaluated against the goals, principles, and specifications defined here.*
