"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { Button } from "@kursa/ui/components/button";
import { SectionHeader } from "./settings-ui";

export default function DocsSection() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/docs");
  }, [router]);

  return (
    <div>
      <SectionHeader
        eyebrow="documentation"
        title="Documentation"
        description="Redirecting you to the Kursa guides and documentation..."
      />

      <div className="rounded-xl p-8 bg-surface border border-line flex flex-col items-center justify-center text-center py-16">
        <div className="relative mb-6">
          {/* Animated pulsing background effect for the icon */}
          <div className="absolute inset-0 bg-accent-soft rounded-full scale-150 animate-ping opacity-30" />
          <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-accent-soft border border-accent-line">
            <CircleHelp className="h-7 w-7 text-accent" />
          </div>
        </div>

        <h3 className="font-semibold text-ink mb-2" style={{ fontSize: "var(--text-lg)" }}>
          Redirecting to Documentation
        </h3>
        <p className="text-mute max-w-sm mb-8" style={{ fontSize: "var(--text-base)" }}>
          We are sending you to the Kursa documentation page. If you are not redirected automatically within a few seconds, please click the button below.
        </p>

        <Button
          onClick={() => router.push("/dashboard/docs")}
          variant="outline"
          className="h-10 px-5 rounded-lg font-medium text-ink bg-bg-sub border border-line cursor-pointer hover:bg-bg-sub-2 transition-colors"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Go to Documentation
        </Button>
      </div>
    </div>
  );
}
