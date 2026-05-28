"use client";

import { Bell, Briefcase, Link2, Lock, Shield, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { key: "profile", label: "Profile", Icon: User },
  { key: "career", label: "Career", Icon: Briefcase },
  { key: "connections", label: "Connections", Icon: Link2 },
  { key: "account", label: "Account", Icon: Lock },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "privacy", label: "Privacy", Icon: Shield },
  { key: "plan", label: "Plan", Icon: Sparkles },
];

export default function SettingsNav({
  activeSection,
  user,
}: {
  activeSection: string;
  user: { name: string; email: string };
}) {
  const router = useRouter();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="flex flex-col h-full">
      <div className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const isActive = activeSection === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => router.push(`/dashboard/settings?section=${key}`)}
              style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "var(--tracking-mono)",
              }}
              className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-1.5 transition-colors text-left cursor-pointer border-l-2 ${
                isActive
                  ? "text-ink bg-bg-sub-2 border-accent font-medium"
                  : "text-mute bg-transparent border-transparent font-normal hover:bg-bg-sub hover:text-ink-2"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* User identity at bottom */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-line">
        <div
          className="mono flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-bg-sub-2 border border-line text-ink-2 font-medium"
          style={{ fontSize: "var(--text-xs)" }}
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-ink" style={{ fontSize: "var(--text-sm)" }}>
            {user.name}
          </span>
          <span className="mono truncate text-mute-2" style={{ fontSize: 10 }}>
            {user.email}
          </span>
        </div>
      </div>
    </nav>
  );
}
