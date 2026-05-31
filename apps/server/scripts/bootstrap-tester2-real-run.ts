/**
 * Real-platform bootstrap for tester2@gmail.com:
 * 1. Distill user memories from journal events (deterministic, no LLM)
 * 2. Generate observations via OpenAI (LLM only — errors if unavailable)
 *
 * Run after: cd packages/db && pnpm seed:tester2
 */
import prisma from "@kursa/db";

import { isFallbackObservationText } from "../src/services/insights.service.js";
import { getObservations } from "../src/services/insights.service.js";
import { runMemoryDistillation } from "../src/services/memory.service.js";

const USER_ID = "vtcP1lykashpapNolH1gqxsr4t8iEQCu";

async function main() {
  const profile = await prisma.profile.findUnique({
    where: { userId: USER_ID },
    select: { id: true },
  });

  if (!profile) {
    console.error("❌ Profile not found — run pnpm seed:tester2 first");
    process.exit(1);
  }

  console.log("Step 1/2: Distilling memories from journal events…");
  await runMemoryDistillation(USER_ID, profile.id);

  const memoryCount = await prisma.userMemory.count({ where: { userId: USER_ID } });
  console.log(`   → ${memoryCount} memories distilled\n`);

  console.log("Step 2/2: Generating observations via OpenAI (gpt-4o-mini)…");
  const start = Date.now();

  const result = await getObservations(USER_ID, 1, 5);

  if (!result) {
    console.error("❌ getObservations returned null");
    process.exit(1);
  }

  if (result.generationSource !== "llm") {
    console.error("❌ Expected generationSource=llm, got:", result.generationSource);
    process.exit(1);
  }

  for (const obs of result.data) {
    if (isFallbackObservationText(obs.text)) {
      console.error("❌ FALLBACK DETECTED — refusing:", obs.text);
      process.exit(1);
    }
  }

  const ariaInJournal = await prisma.careerEvent.count({
    where: { userId: USER_ID, type: "aria_observation" },
  });

  console.log(`\n✅ Real run complete in ${Date.now() - start}ms`);
  console.log(`   generationSource: ${result.generationSource}`);
  console.log(`   observations:     ${result.pagination.total}`);
  console.log(`   journal aria rows: ${ariaInJournal}`);
  console.log(`   memories:         ${memoryCount}\n`);

  for (const obs of result.data) {
    console.log(`   [${obs.type}] ${obs.text}`);
    console.log(`          ${obs.timeAgo} · source: ${obs.source ?? "llm"}\n`);
  }

  console.log("Log in as tester2@gmail.com / password → /dashboard");
}

main().catch((err) => {
  console.error("\n❌ Bootstrap failed:", err instanceof Error ? err.message : err);
  if (err && typeof err === "object" && "details" in err) {
    console.error("   details:", (err as { details?: unknown }).details);
  }
  process.exit(1);
});
