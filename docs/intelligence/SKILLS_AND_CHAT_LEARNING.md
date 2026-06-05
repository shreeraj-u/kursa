# Skills and Chat Learning

This document explains how Kursa now handles skill intelligence from profile data, market signals, and Aria chat.

## What is saved from chat

Every chat message is saved in conversation history. In addition:

- The system attempts to extract **durable memory facts** from substantive messages.
- The system attempts to detect **skill mentions** from non-empty user messages.
- Skill detections are stored as **pending skill proposals** for user confirmation.

## Where to verify in the app

1. **Aria chat (`/dashboard/aria`)**
   - Send a message like: `I am learning JavaScript to level up.`
   - Expect a toast indicating Aria noticed a skill.
   - Look for inline chips linking to the Skills page with `?highlight=<proposalId>`.

2. **Skills page (`/dashboard/skills`)**
   - See **Pending from Aria** cards in the right rail.
   - Click `+ add` to accept and persist skill into profile.
   - Click `dismiss` to reject the proposal.

3. **Journal page (`/dashboard/journal`)**
   - `chat_insight` learning entries are visible in timeline as Aria-tagged events.
   - Aria suggestions use distilled facts from chat and logged activity.

## Skills recommendation sources

The Skills overview merges recommendations from:

- Market demand (job-title skill extraction)
- Active path `skillGaps`
- Learning goals
- Advisor dormant-skill signals
- Recent `skill_evidence` memories

## Confirmation model

Kursa uses **confirm-first** behavior for chat-detected skills:

- Chat creates/upserts pending proposals.
- Profile `Skill` rows are created or updated only when user accepts.
- This prevents accidental pollution from ambiguous chat messages.

## API surfaces

- `GET /api/v1/profile/me/skills/overview`
- `POST /api/v1/profile/me/skills`
- `PUT /api/v1/profile/me/skills/:id`
- `DELETE /api/v1/profile/me/skills/:id`
- `GET /api/v1/profile/me/skill-proposals?status=pending`
- `POST /api/v1/profile/me/skill-proposals/:id/accept`
- `POST /api/v1/profile/me/skill-proposals/:id/dismiss`
