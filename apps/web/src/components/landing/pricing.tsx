import { AnimatedButton } from "@/components/motion/animated-button";
import { FadeUp } from "@/components/motion/fade-up";
import { HoverLift } from "@/components/motion/hover-lift";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

const TIERS = [
  {
    tag: "free", pop: false,
    name: "Open",
    pos: "Enough to feel what it does. No credit card.",
    vol: "3", unit: "path scenarios / month",
    cost: "$0 forever",
    bullets: [
      "Full career map · 3 scenarios",
      "Skills profile, no expiry",
      "10 messages / day with Aria",
      "1 résumé version",
    ],
    cta: "Get started",
  },
  {
    tag: "standard", pop: true,
    name: "Member",
    pos: "For the person actually planning a career, not just looking for a job.",
    vol: "∞", unit: "path scenarios · unlimited",
    cost: "$24 / month · billed yearly",
    bullets: [
      "Everything in Open",
      "Unlimited Aria conversations with memory",
      "Tailored shortlist · refreshed weekly",
      "Unlimited résumé versions + tailoring",
      "Career journal · post-placement",
    ],
    cta: "Start 14-day trial",
  },
  {
    tag: "intensive", pop: false,
    name: "In-search",
    pos: "For the laid-off, the OPT-clocked, the people who need this to work in the next 90 days.",
    vol: "50", unit: "tailored applications / month",
    cost: "$59 / month · cancel anytime",
    bullets: [
      "Everything in Member",
      "Same-day shortlist refresh",
      "Per-application tailoring at depth",
      "Practice interviews with Aria",
      "Priority human review on flagged drafts",
    ],
    cta: "Start In-search",
  },
];

const REASSURANCES = [
  "Cancel anytime",
  "Free tier never expires",
  "Your data is portable on day one",
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <div className="eyebrow mono mb-3">
            <span style={{ color: "var(--mute-3)" }}>·</span> pricing
          </div>
          <h2
            className="font-semibold tracking-tight text-[var(--ink)] mb-4"
            style={{ fontSize: "var(--text-3xl)" }}
          >
            Pay for the relationship. Not the form fields.
          </h2>
          <p className="lede mb-14 max-w-2xl">
            Three tiers. One free. The middle one is what most people use. Nothing here is priced
            per résumé generated or per message sent — the agent gets weirder if you meter it.
          </p>
        </FadeUp>

        <Stagger staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((t) => (
            <StaggerItem key={t.tag}>
              <HoverLift lift={t.pop ? -7 : -5} className="h-full">
                <div
                  className="rounded-xl p-7 flex flex-col h-full"
                  style={{
                    border: t.pop ? "1.5px solid var(--ink)" : "1px solid var(--line)",
                    background: "var(--surface)",
                  }}
                >
                  {/* Tag row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="eyebrow mono">{t.tag}</span>
                    {t.pop && (
                      <span className="chip good">
                        <span className="dot" />
                        most chosen
                      </span>
                    )}
                  </div>

                  <h3
                    className="font-semibold text-[var(--ink)] mb-2"
                    style={{ fontSize: "var(--text-xl)" }}
                  >
                    {t.name}
                  </h3>
                  <p
                    className="leading-relaxed mb-5"
                    style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
                  >
                    {t.pos}
                  </p>

                  <div className="mb-1 flex items-baseline gap-1.5">
                    <span
                      className="font-semibold text-[var(--ink)] tracking-tight"
                      style={{ fontSize: "2.5rem" }}
                    >
                      {t.vol}
                    </span>
                    <span className="meta-text">{t.unit}</span>
                  </div>
                  <div className="mono mb-6" style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
                    {t.cost}
                  </div>

                  <ul className="flex flex-col gap-2 mb-8 flex-1">
                    {t.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2"
                        style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
                      >
                        <span style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }}>·</span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <AnimatedButton href="/login" className={`btn w-full text-center justify-center${t.pop ? "" : " ghost"}`}>
                    {t.cta}
                  </AnimatedButton>
                </div>
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeUp>
          <div className="flex items-center gap-8 mt-10 flex-wrap">
            {REASSURANCES.map((r) => (
              <span key={r} className="eyebrow mono flex items-center gap-1.5">
                <span style={{ color: "var(--accent)" }}>·</span>
                {r}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
