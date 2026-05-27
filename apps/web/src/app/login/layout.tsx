import Link from "next/link";

import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--bg)] px-4">
      <Link href="/" className="mb-10 text-[var(--ink)]">
        <Logo size="sm" />
      </Link>
      {children}
    </div>
  );
}
