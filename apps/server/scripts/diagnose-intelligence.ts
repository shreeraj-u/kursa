import prisma from "@kursa/db";

import { assembleAdvisorContext } from "../src/lib/advisor-context.js";
import { getObservations } from "../src/services/insights.service.js";
import { listEvents } from "../src/services/events.service.js";

async function main() {
  const count = await prisma.careerEvent.count();
  console.log("career_event count:", count);

  const profile = await prisma.profile.findFirst({ select: { userId: true, id: true } });
  if (!profile) {
    console.log("No profile found");
    return;
  }

  console.log("Testing user:", profile.userId);

  const timeline = await listEvents(profile.userId, { page: 1, limit: 5 });
  console.log("timeline events:", timeline.data.length);

  const ctx = await assembleAdvisorContext(profile.userId, "observations");
  console.log("advisor context:", ctx ? "ok" : "null");

  const obs = await getObservations(profile.userId, 1, 4);
  console.log("observations:", obs?.data.length ?? "null");
}

main()
  .catch((e) => {
    console.error("DIAGNOSE FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
