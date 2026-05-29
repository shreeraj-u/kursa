"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "./settings-ui";
import { Toggle } from "./settings-controls";

const STORAGE_KEY = "kursa_notification_prefs";

import type { NotificationPrefs } from "@kursa/types";

const DEFAULTS: NotificationPrefs = {
  checkInReminders: true,
  weeklyDigest: true,
  marketAlerts: false,
  applicationUpdates: true,
};

const ITEMS: { key: keyof NotificationPrefs; label: string; description: string; comingSoon?: boolean }[] = [
  {
    key: "checkInReminders",
    label: "Check-in reminders",
    description: "Weekly and monthly prompts to log your progress and stay on track.",
    comingSoon: true,
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    description: "A summary of your career activity, new market signals, and Aria observations.",
    comingSoon: true,
  },
  {
    key: "marketAlerts",
    label: "Market alerts",
    description: "Notified when demand shifts for skills in your target path.",
    comingSoon: true,
  },
  {
    key: "applicationUpdates",
    label: "Application updates",
    description: "Reminders and nudges for applications in progress.",
    comingSoon: true,
  },
];

export default function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      // ignore
    }
  }, []);

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <SectionHeader
        eyebrow="notifications"
        title="Notifications"
        description="Control what Kursa sends you and when."
      />

      {/* Coming soon banner */}
      <div className="rounded-lg px-4 py-3 mb-4 flex items-center gap-2 bg-bg-sub border border-line">
        <span className="mono text-mute" style={{ fontSize: "var(--text-sm)" }}>
          email notifications ship with check-ins in phase 4 — preferences saved for when it goes live
        </span>
      </div>

      <div className="rounded-xl bg-surface border border-line">
        {ITEMS.map(({ key, label, description, comingSoon }) => (
          <div
            key={key}
            className="flex items-start justify-between gap-4 px-6 py-4 border-b border-line last:border-b-0"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink" style={{ fontSize: "var(--text-base)" }}>
                  {label}
                </span>
                {comingSoon && (
                  <span className="mono text-mute-2 bg-bg-sub-2 border border-line rounded-full px-1.5 py-[1px] tracking-[0.03em]" style={{ fontSize: 9 }}>
                    soon
                  </span>
                )}
              </div>
              <p className="text-mute mt-1" style={{ fontSize: "var(--text-base)" }}>
                {description}
              </p>
            </div>
            <Toggle on={prefs[key]} onChange={() => toggle(key)} disabled={comingSoon} />
          </div>
        ))}
      </div>
    </div>
  );
}
