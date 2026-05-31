import { Queue, Worker } from "bullmq";

import {
  runCheckInReminders,
  runEnrichmentBackfill,
  runNightlyMemoryDistillation,
  runObservationRefresh,
  runPathStaleFlags,
} from "./tasks.js";

const QUEUE_NAME = "kursa-intelligence";

let queue: Queue | null = null;
let worker: Worker | null = null;

function connectionOptions(redisUrl: string) {
  return { url: redisUrl, maxRetriesPerRequest: null };
}

export function startJobWorkers(redisUrl: string): void {
  const connection = connectionOptions(redisUrl);

  queue = new Queue(QUEUE_NAME, { connection });

  void queue.add(
    "enrichment-backfill",
    {},
    { repeat: { pattern: "0 2 * * *" }, jobId: "enrichment-backfill" },
  );
  void queue.add(
    "memory-distill-nightly",
    {},
    { repeat: { pattern: "0 3 * * *" }, jobId: "memory-distill-nightly" },
  );
  void queue.add(
    "observation-refresh",
    {},
    { repeat: { pattern: "0 */6 * * *" }, jobId: "observation-refresh" },
  );
  void queue.add(
    "checkin-reminder",
    {},
    { repeat: { pattern: "0 9 * * 1" }, jobId: "checkin-reminder" },
  );
  void queue.add(
    "path-stale-flag",
    {},
    { repeat: { pattern: "0 4 * * 0" }, jobId: "path-stale-flag" },
  );

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      switch (job.name) {
        case "enrichment-backfill":
          await runEnrichmentBackfill();
          break;
        case "memory-distill-nightly":
          await runNightlyMemoryDistillation();
          break;
        case "observation-refresh":
          await runObservationRefresh();
          break;
        case "checkin-reminder":
          await runCheckInReminders();
          break;
        case "path-stale-flag":
          await runPathStaleFlags();
          break;
        default:
          break;
      }
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(`[jobs] ${job?.name} failed:`, err);
  });

  console.info("[jobs] BullMQ intelligence workers started");
}

export async function stopJobWorkers(): Promise<void> {
  await worker?.close();
  await queue?.close();
  worker = null;
  queue = null;
}
