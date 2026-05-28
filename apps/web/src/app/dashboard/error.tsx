"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 md:p-8 shadow-sm flex flex-col gap-6">
        
        {/* Error notification header */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive flex-shrink-0">
            <AlertCircle className="h-5.5 w-5.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="chip live bg-destructive/5 border-destructive/20 text-destructive text-3xs py-0.5 px-1.5 rounded uppercase">
                <span className="dot bg-destructive" />
                Connection Lost
              </span>
              <span className="mono text-3xs text-mute-2 uppercase tracking-mono">
                db // query_error
              </span>
            </div>
            <h3 className="text-base font-semibold text-ink leading-snug tracking-tight">
              Unable to sync career intelligence
            </h3>
            <p className="text-xs text-mute mt-1 leading-relaxed">
              We encountered a transient network or database issue while preparing your personal dashboard metrics.
            </p>
          </div>
        </div>

        {/* Detailed technical error block */}
        <div className="rounded-lg bg-bg-sub border border-line-2 p-4 font-mono text-2xs text-ink-2">
          <div className="flex items-center justify-between border-b border-line pb-2 mb-2 text-3xs text-mute-2 uppercase tracking-wider">
            <span>diagnostic telemetry</span>
            <span>code: 503</span>
          </div>
          <p className="break-all leading-normal select-all">
            {error.message || "serverFetch failure: failed to load metrics and profiles in a timely manner."}
          </p>
          {error.digest && (
            <div className="mt-2.5 pt-2 border-t border-line/60 text-3xs text-mute-3">
              transaction_digest: {error.digest}
            </div>
          )}
        </div>

        {/* Actions grid */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-ink text-bg px-4 py-2.5 text-xs font-semibold hover:bg-ink-2 active:bg-ink-3 transition-colors cursor-pointer select-none"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface hover:bg-bg-sub text-ink-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer select-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Site
          </Link>
        </div>

      </div>

      {/* Helpful links */}
      <div className="mt-6 flex items-center gap-4 text-3xs mono text-mute-2">
        <span className="hover:text-ink transition-colors cursor-pointer flex items-center gap-1">
          <FileText className="h-3 w-3" />
          view documentation
        </span>
      </div>
    </div>
  );
}
