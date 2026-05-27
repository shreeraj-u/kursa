import { AnimatedButton } from "@/components/motion/animated-button";
import { FadeUp } from "@/components/motion/fade-up";

export default function EndCTA() {
  return (
    <section className="py-28 border-b border-[var(--line)]">
      <FadeUp className="mx-auto max-w-2xl px-6 text-center">
        <h2
          className="font-semibold tracking-tight text-[var(--ink)] mb-5 leading-tight"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
        >
          The career was always going to be long.
          <br />
          <span style={{ color: "var(--mute-2)" }}>Now it has someone watching.</span>
        </h2>
        <p className="lede mb-8">Start in three minutes. No résumé upload. No quiz.</p>
        <AnimatedButton href="/login" className="btn lg">
          Get started — free
        </AnimatedButton>
      </FadeUp>
    </section>
  );
}
