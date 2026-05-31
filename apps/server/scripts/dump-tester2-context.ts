/** Dump advisor context for tester2 — read-only proof script */
import { assembleAdvisorContext, hashAdvisorContext } from "../src/lib/advisor-context.js";

const USER_ID = "vtcP1lykashpapNolH1gqxsr4t8iEQCu";

const ctx = await assembleAdvisorContext(USER_ID, "observations");
if (!ctx) {
  console.error("No context");
  process.exit(1);
}

console.log(JSON.stringify({
  signalsHash: hashAdvisorContext(ctx),
  signals: ctx.signals,
  memories: ctx.memories,
  recentEvents: ctx.recentEvents.map((e) => ({
    id: e.id,
    type: e.type,
    body: e.body?.slice(0, 80),
    sentiment: e.sentiment,
    occurredAt: e.occurredAt,
  })),
  llmPayloadPreview: {
    signals: ctx.signals,
    memories: ctx.memories.map((m) => m.fact),
    recentActivity: ctx.recentEvents.slice(0, 10).map((e) => ({
      type: e.type,
      body: e.body,
      occurredAt: e.occurredAt,
    })),
    activePathTitle: ctx.activePath?.title ?? null,
  },
}, null, 2));
