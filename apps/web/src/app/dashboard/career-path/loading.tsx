import PageHeader from "@/components/dashboard/page-header";
import { Skeleton } from "@kursa/ui/components/skeleton";

export default function CareerPathLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Career path" />
      <div className="px-8 pt-6 pb-8 flex flex-col gap-5 flex-1">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded bg-line" />
          <Skeleton className="h-7 w-32 rounded bg-line-2" />
        </div>

        {/* Grid layout matching page.tsx */}
        <div className="grid grid-cols-[280px_1fr] gap-5 max-lg:flex max-lg:flex-col">
          
          {/* Left Column: Path Selector */}
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <Skeleton className="h-4 w-3/4 rounded bg-line" />
                  <Skeleton className="h-3 w-8 rounded bg-line-2 flex-shrink-0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-1/2 rounded bg-line-2" />
                  <Skeleton className="h-3 w-2/3 rounded bg-line-3" />
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Path Details & Roadmap */}
          <div className="flex flex-col gap-4">
            
            {/* Path Details Panel */}
            <div className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-5 w-1/2 rounded bg-line" />
                  <Skeleton className="h-4 w-1/3 rounded bg-line-2" />
                </div>
                <Skeleton className="h-7 w-24 rounded bg-line-2 flex-shrink-0" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-full rounded bg-line-2" />
                <Skeleton className="h-3.5 w-5/6 rounded bg-line-2" />
                <Skeleton className="h-3.5 w-4/5 rounded bg-line-2" />
              </div>
            </div>

            {/* Path Roadmap */}
            <div className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-4">
              <div className="mono text-2xs text-mute-2 uppercase tracking-wider">
                milestones
              </div>
              <div className="flex flex-col gap-4 mt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 items-start pb-3 border-b border-line last:border-0 last:pb-0">
                    <Skeleton className="h-6 w-6 rounded-full bg-line-2 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="h-4 w-1/3 rounded bg-line" />
                      <Skeleton className="h-3 w-3/4 rounded bg-line-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Path Pulse Panel */}
        <div className="rounded-lg p-4 border border-line bg-surface">
          <div className="mono mb-4 text-2xs text-mute-2 uppercase tracking-wider">
            career pulse
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-line rounded-md p-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-1/3 rounded bg-line-2" />
                <Skeleton className="h-7 w-1/2 rounded-md bg-line" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
