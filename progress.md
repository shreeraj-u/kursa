# Kursa — Project Progress
> Last updated: 2026-06-02

---

## In Progress

| Feature | Who | Notes |
|---|---|---|
| Profile — Projects editing | Partner | Settings UI for add/edit/delete projects (DB model exists) |
| Aria chatbot (conversational) | Partner | Full chat UI using existing `/chat` + `/chat/:id/messages` endpoints |

---

## To Do

### High priority
- [ ] **Career Path page** — `/dashboard/career-path/page.tsx` missing (only skeleton). Backend journey endpoints fully built.
- [ ] **Review & merge `feat/skill-gap-engine`** — 1 unmerged commit (`fix/validation fixes`)
- [ ] **Review & merge `feat/github-integraiton`** — 1 unmerged commit (`fix/vulnerability fix`), typo in branch name

### Medium priority
- [ ] **Notifications settings** — Section exists in settings but is a placeholder.
- [ ] **Data export** — Privacy section has disabled "Export data" button.

### Low priority / Later
- [ ] **Billing / Plans** — Phase 7, not started.
- [ ] **`/dashboard/docs`** — Verify if real content or placeholder.
- [ ] **Export weekly digest** — Button exists in `dashboard.tsx:30`, needs digest endpoint.
- [ ] **Aria observation `open` link** — `aria-noticed.tsx:112`, needs observation routing.
- [ ] **Aria observation `dis` (dismiss) link** — `aria-noticed.tsx:115`, needs dismiss API.
- [ ] **`0 dismissed` count** — Hardcoded in Aria header, needs dismiss tracking.

---

## Done

| Feature | Notes |
|---|---|
| Auth + Onboarding | Complete |
| Profile / Settings (name, bio, location, social links) | Complete |
| GitHub import | Full flow — idle → loading → review → syncing → done |
| Resume Studio | Generate, ATS score, improve, PDF download |
| Job Application Tracker | Kanban CRUD with stage management |
| Skills Studio | Inventory, gap analysis, learning goals |
| Career Journey | AI-generated paths, milestones, pulse metrics |
| Journal | 5 entry types, proactive prompts, review prep, memory indexing |
| Aria observations panel | Dashboard home widget, paginated LLM observations |
| Dashboard metrics | Greeting, in-flight, recent activity |
| Career Pulse | Wired to real data — growth/visibility/progression from live DB |
| Branch cleanup | 13 stale local branches + 2 old worktrees removed (2026-06-02) |
| AI model names | Already correct — `gpt-4o` / `gpt-4o-mini` in `src/lib/ai/prompts.ts` |
