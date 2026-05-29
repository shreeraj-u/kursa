import { Button } from "@kursa/ui/components/button";
import { FadeUp } from "@/components/motion/fade-up";

export default function EndCTA() {
  return (
    <section className="relative py-28 border-b border-[var(--line)] overflow-hidden">
      {/* Static centered orb — no JS needed */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, var(--accent-soft) 0%, transparent 70%)",
        }}
      />

      <FadeUp className="relative mx-auto max-w-2xl px-6 text-center">
        <h2
          className="font-semibold tracking-tight text-[var(--ink)] mb-5 leading-tight"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
        >
          The career was always going to be long.
          <br />
          <span style={{ color: "var(--mute-2)" }}>Now it has someone watching.</span>
        </h2>
        <p className="lede mb-8">Start in three minutes. No résumé upload. No quiz.</p>
        <Button size="lg" render={<a href="/login" />} nativeButton={false}>
          Get started — free
        </Button>
      </FadeUp>
    </section>
  );
}
