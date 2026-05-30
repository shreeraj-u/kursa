# Goal Description

Phase 0 sets the foundation for the Kursa platform by implementing **Layer 1: Deep User Profiling** as defined in the PRD. The goal is to initialize the database schema for user profiles, skills, work history, and preferences, and then build the multi-step Onboarding UI where users populate this data upon first login.

## User Review Required

> [!IMPORTANT]
> Since Prisma's multi-file schema feature is enabled (`schema/auth.prisma` and `schema/schema.prisma`), I propose creating a new `schema/profile.prisma` file to keep domain logic clean. 

## Open Questions

> [!WARNING]
> 1. **Resume Upload:** The PRD mentions parsing resumes via Claude to extract work history. Should we include the Resume PDF upload & parsing in Phase 0 onboarding, or start with manual entry and add the AI parser later?
> 2. **State Management:** You are using `@tanstack/react-form`. For a multi-step form, do you prefer a single massive form state or separate form submissions per step that incrementally save to the database? Incremental saving is usually safer for onboarding flows.
> 3. **LLM Data Cleanup:** The updated PRD mandates using Claude for LLM data cleanup and standardization after onboarding questions are answered. Should this clean-up step occur synchronously on the final onboarding step submission, or run asynchronously in the background once the initial profile has been created?

## Proposed Changes

---

### Database Schema (`@kursa/db`)

We will introduce a new `profile.prisma` file containing the core domain models. 

#### [NEW] [profile.prisma](file:///Users/kaikameyama/repos/kursa/packages/db/prisma/schema/profile.prisma)
```prisma
// Profile - 1:1 with User
model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  currentRole    String?
  location       String?
  bio            String?
  onboardingDone Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// WorkHistory - 1:N with User
model WorkHistory {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company         String
  role            String
  startDate       DateTime
  endDate         DateTime?
  isCurrent       Boolean   @default(false)
  description     String?   // responsibilities vs outcomes
  companySize     String?   // startup, scale-up, enterprise
  teamStructure   String?   // IC, lead, manager
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// UserSkill - M:N mapping representing user's relationship with skills
model UserSkill {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String   // Skill name (e.g., React, Leadership)
  type            String   // "HARD" | "SOFT"
  confidenceLevel Int      // 1-5
  recency         String   // "ACTIVE" | "DORMANT" | "HISTORICAL"
  source          String   // "SELF_REPORTED" | "INFERRED_RESUME"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, name])
}

// Preference - 1:1 with User
model Preference {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  workEnvironment String?  // startup, corporate, remote, hybrid
  riskAppetite    String?  // stability_seeking, balanced, high_growth
  minSalary       Int?
  workingStyle    String?
  targetRoles     String[] // Aspirations layer
  horizon         String?  // 3-year, 5-year
}
```

#### [MODIFY] [auth.prisma](file:///Users/kaikameyama/repos/kursa/packages/db/prisma/schema/auth.prisma)
Add the relation fields to the `User` model to link it to the newly created models:
- `profile       Profile?`
- `workHistories WorkHistory[]`
- `skills        UserSkill[]`
- `preference    Preference?`

---

### Backend / Server Actions (`apps/web`)

#### [NEW] [actions.ts](file:///Users/kaikameyama/repos/kursa/apps/web/src/app/onboarding/actions.ts)
Implement Next.js Server Actions (using Zod validation) to safely write onboarding data to the database.
- `updateBasicProfile(data)`
- `addWorkHistory(data)`
- `updateSkills(data)`
- `updatePreferences(data)`
- `completeOnboarding()`

---

### Frontend UI (`apps/web`)

We will build a multi-step onboarding wizard using Shadcn components and `@tanstack/react-form`.

#### [NEW] [page.tsx](file:///Users/kaikameyama/repos/kursa/apps/web/src/app/onboarding/page.tsx)
The main container for the onboarding wizard. Contains a progress bar and conditionally renders the current step component. If the user hasn't completed onboarding, they should be redirected here from the dashboard.

#### [NEW] [basic-info-step.tsx](file:///Users/kaikameyama/repos/kursa/apps/web/src/app/onboarding/_components/basic-info-step.tsx)
Form for collecting basic details (Current Role, Location).

#### [NEW] [work-history-step.tsx](file:///Users/kaikameyama/repos/kursa/apps/web/src/app/onboarding/_components/work-history-step.tsx)
Form allowing users to dynamically add previous roles and experiences.

#### [NEW] [skills-step.tsx](file:///Users/kaikameyama/repos/kursa/apps/web/src/app/onboarding/_components/skills-step.tsx)
A dynamic input allowing users to add skills, tag them as "Hard" or "Soft", and rate their confidence level from 1 to 5.

#### [NEW] [preferences-step.tsx](file:///Users/kaikameyama/repos/kursa/apps/web/src/app/onboarding/_components/preferences-step.tsx)
Radio buttons and select inputs for gathering risk appetite, work environment preferences, and future target roles.

## Verification Plan

### Automated Tests
1. Run `pnpm turbo build` and `pnpm turbo check-types` to ensure strict typing across the monorepo is intact.
2. Run Prisma migrations locally: `pnpm --filter @kursa/db db:migrate` and verify the Neon DB updates successfully.

### Manual Verification
1. Sign up as a new user. 
2. Verify you are automatically redirected to `/onboarding`.
3. Complete all 4 steps of the wizard.
4. Check the `neon` or `prisma studio` dashboard to confirm relational data was properly written to `Profile`, `WorkHistory`, `UserSkill`, and `Preference` tables.
5. Verify successful redirect to `/dashboard` upon completion.
