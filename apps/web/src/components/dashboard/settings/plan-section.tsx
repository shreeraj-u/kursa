"use client";

import { Button } from "@kursa/ui/components/button";
import { SectionHeader } from "./settings-ui";

const PLANS = [
  {
    key: "free",
    label: "Free",
    price: "$0",
    description: "Get started with the fundamentals.",
    features: [
      "Profile builder",
      "Basic career path mapping (1 path)",
      "Monthly check-ins",
      "Social link management",
    ],
    unavailable: [
      "Full path intelligence (3–5 paths)",
      "Skill gap engine",
      "Resume autogeneration",
      "Weekly check-ins",
      "Advisory chat (Aria)",
      "Smart job execution",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    price: "$20",
    period: "/month",
    description: "The full platform for intentional career growth.",
    features: [
      "Everything in Free",
      "Full path intelligence (3–5 paths)",
      "Skill gap engine with market data",
      "Resume autogeneration and tailoring",
      "Brand management",
      "Weekly check-ins",
      "Advisory chat (Aria) — core decisions",
      "Smart job execution",
    ],
    unavailable: [
      "Unlimited advisory chat",
      "Salary negotiation intelligence",
      "Interview coaching",
      "Human advisor escalation",
    ],
  },
  {
    key: "premium",
    label: "Premium",
    price: "$50",
    period: "/month",
    description: "For those making high-stakes career moves.",
    features: [
      "Everything in Pro",
      "Unlimited advisory chat",
      "Salary negotiation intelligence",
      "Interview coaching",
      "Human advisor escalation",
    ],
    unavailable: [],
  },
];

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6.5" fill="var(--accent)" fillOpacity="0.15" />
      <path d="M3.5 6.5L5.5 8.5L9.5 4.5" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6.5" fill="var(--line-2)" />
      <path d="M4.5 4.5L8.5 8.5M8.5 4.5L4.5 8.5" stroke="var(--mute-3)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function PlanSection() {
  const currentPlan = "free";

  return (
    <div>
      <SectionHeader
        eyebrow="plan"
        title="Plan & billing"
        description={<>You're on the <strong className="font-semibold text-ink">Free</strong> plan. Upgrade to unlock the full platform.</>}
      />

      {/* Plan cards */}
      <div className="flex flex-col gap-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          return (
            <div
              key={plan.key}
              className={`rounded-xl p-5 bg-surface border ${isCurrent ? "border-accent-line" : "border-line"}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-ink" style={{ fontSize: "var(--text-base)" }}>
                      {plan.label}
                    </span>
                    {isCurrent && (
                      <span
                        className="mono text-mute-2 bg-bg-sub-2 border border-line rounded-full px-1.5 py-[1px] tracking-[0.03em]"
                        style={{ fontSize: 9 }}
                      >
                        current plan
                      </span>
                    )}
                  </div>
                  <p className="text-mute mt-1" style={{ fontSize: "var(--text-base)" }}>
                    {plan.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-medium text-ink" style={{ fontSize: "var(--text-base)" }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="font-medium text-ink" style={{ fontSize: "var(--text-base)" }}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-1.5 mb-4">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check />
                    <span className="font-medium text-ink" style={{ fontSize: "var(--text-base)" }}>{f}</span>
                  </div>
                ))}
                {plan.unavailable.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Cross />
                    <span className="font-medium text-ink" style={{ fontSize: "var(--text-base)" }}>{f}</span>
                  </div>
                ))}
              </div>

              {!isCurrent && (
                <Button
                  disabled
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 rounded-lg font-medium text-mute-2 bg-bg-sub border border-line cursor-not-allowed"
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  Upgrade to {plan.label} — coming soon
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mono mt-4 text-mute-2 text-center" style={{ fontSize: "var(--text-sm)" }}>
        Billing integration ships with Phase 7. All features are free during early access.
      </p>
    </div>
  );
}
