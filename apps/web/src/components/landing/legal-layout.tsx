import React from "react";
import LandingNav from "@/components/landing/nav";
import LandingFooter from "@/components/landing/footer";

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ eyebrow, title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <LandingNav />
        <main className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-12 border-b border-[var(--line)] pb-8">
            <span className="mono uppercase tracking-widest text-[var(--accent)] font-medium block mb-3 text-[10px]">
              {eyebrow}
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--ink)] mb-4">
              {title}
            </h1>
            <p className="mono text-[var(--mute)] text-[11px]">
              {lastUpdated}
            </p>
          </div>
          
          <div className="prose prose-sm max-w-none text-[var(--ink-2)] space-y-8 leading-relaxed">
            {children}
          </div>
        </main>
      </div>
      <LandingFooter />
    </div>
  );
}
