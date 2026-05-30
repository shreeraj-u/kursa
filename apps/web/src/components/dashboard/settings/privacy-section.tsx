"use client";

import { Button } from "@kursa/ui/components/button";
import { SectionHeader } from "./settings-ui";

const DATA_CATEGORIES = [
  {
    label: "Profile & identity",
    items: ["Name, email, location, bio", "Work history and education", "Skills and certifications", "Social links"],
  },
  {
    label: "Career data",
    items: ["Target roles and industries", "Values and work preferences", "3-year and 5-year goals", "Success definition"],
  },
  {
    label: "Activity",
    items: ["Job applications and outcomes", "Learning goals and progress", "Check-in responses and sentiment", "Conversations with Aria"],
  },
];

export default function PrivacySection() {
  return (
    <div>
      <SectionHeader
        eyebrow="privacy"
        title="Privacy & data"
        description="Your data belongs to you. Here's exactly what we store and why."
      />

      {/* Principles */}
      <div className="rounded-xl p-6 mb-4 bg-surface border border-line">
        <h3 className="font-semibold text-ink mb-3" style={{ fontSize: "var(--text-lg)" }}>
          Our commitment
        </h3>
        <div className="flex flex-col gap-3">
          {[
            ["Your data powers your advice, nothing else", "Everything we store is used to make Kursa more useful to you — not to train models, serve ads, or sell to third parties."],
            ["You can delete everything, any time", "Deleting your account permanently removes all your data from our systems within 30 days."],
            ["We never sell your data", "Not to recruiters, not to employers, not to anyone. Ever."],
          ].map(([title, body]) => (
            <div key={title} className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
              <div>
                <p className="font-medium text-ink" style={{ fontSize: "var(--text-base)" }}>{title}</p>
                <p className="text-mute mt-0.5" style={{ fontSize: "var(--text-base)" }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What we store */}
      <div className="rounded-xl p-6 mb-4 bg-surface border border-line">
        <h3 className="font-semibold text-ink mb-3" style={{ fontSize: "var(--text-lg)" }}>
          What we store
        </h3>
        <div className="flex flex-col gap-5">
          {DATA_CATEGORIES.map(({ label, items }) => (
            <div key={label}>
              <p
                className="mono text-mute-2 mb-2 tracking-[0.05em] uppercase"
                style={{ fontSize: "var(--text-xs)" }}
              >
                {label}
              </p>
              <div className="flex flex-col gap-1">
                {items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-line-3 shrink-0" />
                    <span className="text-ink" style={{ fontSize: "var(--text-base)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="rounded-xl p-6 bg-surface border border-line">
        <h3 className="font-semibold text-ink mb-1" style={{ fontSize: "var(--text-lg)" }}>
          Export your data
        </h3>
        <p className="text-mute mt-1 mb-4" style={{ fontSize: "var(--text-base)" }}>
          Download a complete copy of everything Kursa has stored about you as JSON.
        </p>
        <div className="flex items-center gap-3">
          <Button
            disabled
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg font-medium text-mute-2 bg-bg-sub border border-line cursor-not-allowed"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Export data
          </Button>
          <span className="mono text-mute" style={{ fontSize: "var(--text-sm)" }}>
            coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
