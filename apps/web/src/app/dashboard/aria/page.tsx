import { Suspense } from "react";

import { requireOnboarded } from "@/lib/require-onboarded";

import AriaChat from "@/components/dashboard/aria/aria-chat";

export default async function AriaPage() {
  await requireOnboarded();

  return (
    <Suspense fallback={<div className="px-8 py-12 mono text-2xs text-mute">Loading Aria…</div>}>
      <AriaChat />
    </Suspense>
  );
}
