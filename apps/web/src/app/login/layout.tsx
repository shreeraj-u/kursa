import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-[var(--bg)] px-4">
      <Link href="/" className="mb-10 flex items-center gap-2.5 group">
        <div className="w-6 h-6 rounded-[4px] bg-[var(--ink)] flex items-center justify-center">
          <span
            className="text-[var(--bg)] font-semibold leading-none"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
          >
            K
          </span>
        </div>
        <span
          className="font-semibold text-[var(--ink)] tracking-tight"
          style={{ fontSize: "var(--text-md)" }}
        >
          Kursa
        </span>
      </Link>
      {children}
    </div>
  );
}
