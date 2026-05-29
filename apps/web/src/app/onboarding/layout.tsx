import Link from "next/link";

import { Logo } from "@/components/logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--bg)] px-4 py-8">
      <Link href="/" className="mb-8 text-[var(--ink)]">
        <Logo size="sm" />
      </Link>
      {children}
    </div>
  );
}
