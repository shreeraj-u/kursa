import { requireOnboarded } from "@/lib/require-onboarded";

import JournalClient from "@/components/dashboard/journal/journal-client";

export default async function JournalPage() {
  await requireOnboarded();
  return <JournalClient />;
}
