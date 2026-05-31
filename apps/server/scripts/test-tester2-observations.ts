/**
 * One-shot test: generate observations for tester2@gmail.com (single LLM call).
 * Run: cd apps/server && npx tsx --env-file=.env scripts/test-tester2-observations.ts
 */
import { getObservations, isFallbackObservationText } from "../src/services/insights.service.js";

const USER_ID = "vtcP1lykashpapNolH1gqxsr4t8iEQCu";

async function main() {
  console.log("Generating observations for tester2…");
  const start = Date.now();

  const result = await getObservations(USER_ID, 1, 5);

  if (!result) {
    console.error("❌ getObservations returned null — profile missing?");
    process.exit(1);
  }

  if (result.generationSource !== "llm") {
    console.error("❌ Not LLM-sourced:", result.generationSource);
    process.exit(1);
  }

  for (const obs of result.data) {
    if (isFallbackObservationText(obs.text)) {
      console.error("❌ FALLBACK TEXT DETECTED:", obs.text);
      process.exit(1);
    }
  }

  console.log(`\n✅ Done in ${Date.now() - start}ms · source: ${result.generationSource}`);
  console.log(`   Total observations: ${result.pagination.total}\n`);

  for (const obs of result.data) {
    console.log(`   [${obs.type}] ${obs.text}`);
    console.log(`          ${obs.timeAgo}\n`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
