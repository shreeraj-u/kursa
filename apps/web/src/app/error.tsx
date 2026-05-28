"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or error service
    console.error("Root uncaught boundary:", error);
  }, [error]);

  return (
    <div className="min-h-svh w-screen flex flex-col items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 md:p-8 shadow-sm">
        {/* Error icon & title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="mono text-3xs text-destructive tracking-mono uppercase block mb-0.5">
              system fault
            </span>
            <h2 className="text-base font-semibold text-ink leading-tight tracking-tight">
              An unexpected error occurred
            </h2>
          </div>
        </div>

        {/* Detailed feedback */}
        <div className="rounded-md bg-bg-sub border border-line-2 p-3.5 mb-6">
          <p className="font-mono text-2xs text-ink-2 leading-relaxed break-all select-all">
            {error.message || "Unknown execution issue occurred in the root render shell."}
          </p>
          {error.digest && (
            <div className="mt-2 pt-2 border-t border-line mono text-3xs text-mute-2">
              digest: {error.digest}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-ink text-bg px-4 py-2 text-xs font-medium hover:bg-ink-2 active:bg-ink-3 transition-colors cursor-pointer select-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface hover:bg-bg-sub text-ink-2 px-4 py-2 text-xs font-medium transition-colors cursor-pointer select-none"
          >
            <Home className="h-3.5 w-3.5" />
            Go Home
          </Link>
        </div>
      </div>
      
      {/* Branding footer */}
      <span className="mt-8 mono text-3xs text-mute-3 tracking-mono lowercase select-none">
        kursa // orbital operating system
      </span>
    </div>
  );
}
