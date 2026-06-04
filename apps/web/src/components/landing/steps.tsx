import { FadeUp } from "@/components/motion/fade-up";
import { HoverLift } from "@/components/motion/hover-lift";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

const STEPS = [
  {
    n: "01",
    k: "remember",
    t: "Build career memory.",
    d: "Your profile, résumé import, journal entries, applications, and check-ins become one durable model — not scattered form fields.",
  },
  {
    n: "02",
    k: "reason",
    t: "Commit to a path.",
    d: "Kursa turns that model into a reasoned journey with milestones, risks, skill gaps, and concrete actions.",
  },
  {
    n: "03",
    k: "package",
    t: "Apply with evidence.",
    d: "Résumé versions and application tracking stay tied to the path, so every move compounds the same career strategy.",
  },
  {
    n: "04",
    k: "compound",
    t: "Keep learning from work.",
    d: "The journal captures wins, feedback, and drift signals so Aria gets sharper after the demo, not just during onboarding.",
  },
];

export default function Steps() {
  return (
    <section id="how" className="py-24 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <div className="eyebrow mono mb-3">
            <span style={{ color: "var(--mute-3)" }}>·</span> how it works
          </div>
          <h2
            className="font-semibold tracking-tight text-[var(--ink)] mb-4"
            style={{ fontSize: "var(--text-3xl)" }}
          >
            One advisor. The whole career.
          </h2>
          <p className="lede mb-14 max-w-2xl">
            Most career tools wake up when you start applying and disappear once you've signed.
            Kursa is the other way around — present in the long stretch between, where the work
            actually happens.
          </p>
        </FadeUp>

        <Stagger staggerDelay={0.07} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <StaggerItem key={s.n} className="h-full">
              <HoverLift lift={-5} className="h-full">
                <div className="border border-[var(--line)] rounded-xl p-6 bg-[var(--surface)] h-full group transition-colors duration-200 hover:border-[var(--line-3)]">
                  <div className="eyebrow mono mb-4 transition-colors duration-200 group-hover:text-[var(--ink-2)]">
                    <span style={{ color: "var(--ink)", fontWeight: 600 }}>{s.n}</span> · {s.k}
                  </div>
                  <h4
                    className="font-semibold text-[var(--ink)] mb-2.5 tracking-tight leading-snug"
                    style={{ fontSize: "var(--text-lg)" }}
                  >
                    {s.t}
                  </h4>
                  <p
                    className="leading-relaxed"
                    style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
                  >
                    {s.d}
                  </p>
                </div>
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
