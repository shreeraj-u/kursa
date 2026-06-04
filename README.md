<div align="center">


<pre>
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           ██╗  ██╗██╗   ██╗██████╗ ███████╗ █████╗           ║
║           ██║ ██╔╝██║   ██║██╔══██╗██╔════╝██╔══██╗          ║
║           █████╔╝ ██║   ██║██████╔╝███████╗███████║          ║
║           ██╔═██╗ ██║   ██║██╔══██╗╚════██║██╔══██║          ║
║           ██║  ██╗╚██████╔╝██║  ██║███████║██║  ██║          ║
║           ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝          ║
║                                                              ║
║           Persistent AI career intelligence                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
</pre>

</div>

Kursa is a persistent AI career advisor. It builds an evolving profile of a user's professional identity, then turns that profile into practical guidance: career journeys, skill gaps, résumé support, job application tracking, journal-driven insights, and proactive observations.

The core idea is simple: the profile is the product. Every feature reads from and improves a durable model of the user's skills, experience, achievements, goals, applications, and constraints so guidance can become more specific over time.

## What Kursa does

- Builds a structured career profile from onboarding and résumé import.
- Generates a single AI-committed career journey with milestones, fit reasoning, risks, gaps, and next actions.
- Tracks skill inventory, proficiency, confidence, dormant skills, and learning goals.
- Produces résumé versions shaped to the user's profile and target path, with ATS scoring and improvement drafts.
- Manages job applications through a Kanban-style tracker.
- Captures journal entries and career events for memory, milestone evidence, dashboard signals, and review prep.
- Surfaces AI observations and dashboard intelligence from live profile data.
- Supports chat through Aria, the conversational advisor layer.

## Repository layout

```text
kursa/
├── apps/
│   ├── web/          Next.js app on port 3001
│   └── server/       Express API on port 3000
├── packages/
│   ├── auth/         Better Auth configuration and helpers
│   ├── config/       Shared TypeScript configuration
│   ├── db/           Prisma schema, migrations, seeds, and client exports
│   ├── env/          Shared environment validation
│   ├── types/        Shared domain/API types
│   └── ui/           Shared shadcn/ui primitives and global styles
├── docs/             Product and implementation notes
├── specs/            Feature specs
├── designs/          Design references
├── CONTEXT.md        Domain glossary and product language
└── progress.md       Current project status
```

## Tech stack

- TypeScript across the monorepo
- Next.js, React, Tailwind CSS, and shadcn/ui for the web app
- Express for the API server
- Prisma with PostgreSQL for persistence
- Better Auth for authentication
- OpenAI-backed AI services for extraction, generation, enrichment, and advice
- Turborepo and pnpm workspaces for orchestration

## Prerequisites

- Node.js compatible with the workspace dependencies
- pnpm 10.12.1 or newer
- PostgreSQL database
- Environment variables for the web app, server, database, auth, and AI providers

The app expects environment files under `apps/web/.env` and `apps/server/.env`. The exact values depend on your local database, auth secrets, and AI provider keys.

## Getting started

Install dependencies:

```bash
pnpm install
```

Generate the Prisma client:

```bash
pnpm run db:generate
```

Apply the database schema:

```bash
pnpm run db:push
```

Start the development servers:

```bash
pnpm run dev
```

Open the web app at:

```text
http://localhost:3001
```

The API runs at:

```text
http://localhost:3000
```

## Development commands

| Command | Description |
|---|---|
| `pnpm run dev` | Start all apps through Turborepo |
| `pnpm run build` | Build all apps and packages |
| `pnpm run check-types` | Type-check the monorepo |
| `pnpm run dev:web` | Start only the Next.js web app |
| `pnpm run dev:server` | Start only the Express API |
| `pnpm run db:generate` | Generate Prisma client files |
| `pnpm run db:push` | Push the Prisma schema to the database |
| `pnpm run db:migrate` | Create and apply a Prisma migration |
| `pnpm run db:studio` | Open Prisma Studio |

The server package also includes a targeted test command:

```bash
pnpm --filter server test
```

## Database workflow

Prisma lives in `packages/db`.

Important paths:

```text
packages/db/prisma/schema/       Split Prisma schema files
packages/db/prisma/migrations/   Database migrations
packages/db/prisma/seed*.ts      Seed scenarios
packages/db/src/index.ts         Database exports
```

Common workflow:

```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run check-types
```

Use `db:push` for quick local schema sync and `db:migrate` when you need a committed migration.

## Product surfaces

The main web surfaces live under `apps/web/src/app`:

- `/dashboard` for the career dashboard and observations
- `/dashboard/settings` for profile and account settings
- `/dashboard/skills` for skill inventory, gaps, and learning goals
- `/dashboard/resume` for résumé generation, versions, ATS scoring, and PDF download
- `/dashboard/applications` for job application tracking
- `/dashboard/journal` for career journal entries and memory capture
- `/dashboard/career-journey` for generated journeys and milestones
- `/onboarding` for initial profile intake

## API surface

The API is organized around versioned routes in `apps/server/src/routes/v1` and controller/service pairs in `apps/server/src/controllers` and `apps/server/src/services`.

Key domains include:

- onboarding and résumé extraction
- profile management
- skills and learning goals
- career journeys and milestones
- journal entries and career events
- dashboard intelligence and observations
- applications and job tracking
- chat and advisor context
- GitHub and LinkedIn sync

## Shared UI

Shared shadcn/ui primitives live in `packages/ui`.

Update shared styling here:

```text
packages/ui/src/styles/globals.css
packages/ui/src/components/
packages/ui/components.json
```

Import shared primitives from app code like this:

```tsx
import { Button } from "@kursa/ui/components/button";
```

Add more shared primitives from the repository root:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

## Project conventions

- Keep the profile as the durable source of truth.
- Do not invent user facts in AI generation; generated output must be grounded in profile, résumé, journal, or application evidence.
- Treat `CONTEXT.md` as the canonical product vocabulary.
- Prefer shared types and shared UI primitives over duplicated app-local definitions.
- Keep database changes explicit through Prisma schema updates and migrations.
- Verify changes with targeted tests first, then type-check or build when appropriate.

## Current status

See `progress.md` for the latest implementation status, active work, and known gaps.

