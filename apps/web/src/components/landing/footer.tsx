import { Logo } from "@/components/logo";
import { FadeUp } from "@/components/motion/fade-up";

const COLS = [
  {
    title: "product",
    links: [
      { label: "Career map", href: "/#features" },
      { label: "Skills profile", href: "/#features" },
      { label: "Resume studio", href: "/#features" },
      { label: "Role shortlist", href: "/#features" },
      { label: "Journal", href: "/#features" },
    ],
  },
  {
    title: "legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data policy", href: "/data-policy" },
      { label: "Security", href: "/security" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="pt-16 pb-10 bg-[var(--bg)]">
      <FadeUp className="mx-auto max-w-6xl px-6">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-14">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="inline-block mb-4 text-[var(--ink)]">
              <Logo size="sm" />
            </a>
            <p
              className="leading-relaxed max-w-[180px]"
              style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}
            >
              An AI career advisor with persistent memory. Built for people whose careers compound
              over years, not weekends.
            </p>
          </div>

          {/* Link cols */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h6
                className="mono uppercase tracking-widest mb-4"
                style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}
              >
                {col.title}
              </h6>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="transition-colors hover:text-[var(--ink)]"
                      style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright row */}
        <div className="flex items-center justify-between pt-8 border-t border-[var(--line)] flex-wrap gap-4">
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
            © 2026 Kursa Labs · Singapore
          </span>
          <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
            v 2.4 · last shipped 4 days ago
          </span>
        </div>
      </FadeUp>
    </footer>
  );
}
