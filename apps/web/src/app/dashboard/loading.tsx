import PageHeader from "@/components/dashboard/page-header";
import { Skeleton } from "@kursa/ui/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Home" />

      {/* Greeting skeleton row */}
      <div className="px-8 pt-6 pb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2 w-full max-w-md">
          {/* Greeting title skeleton */}
          <Skeleton className="h-6 w-3/4 rounded-md bg-line" />
          {/* Subtitle skeleton */}
          <Skeleton className="h-4 w-1/2 rounded-md bg-line-2" />
        </div>
        {/* Export button skeleton */}
        <Skeleton className="h-7 w-32 rounded-md bg-line mt-1.5 self-start sm:self-auto" />
      </div>

      {/* Main grid */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 flex-1">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          
          {/* Career pulse skeleton card */}
          <div className="rounded-lg p-4 border border-line bg-surface">
            <div className="mono mb-4 text-2xs text-mute-2 uppercase tracking-wider">
              career pulse
            </div>
            
            {/* Mock stats grid representing Career Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="border border-line rounded-md p-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-1/3 rounded bg-line-2" />
                <Skeleton className="h-7 w-1/2 rounded-md bg-line" />
              </div>
              <div className="border border-line rounded-md p-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-1/2 rounded bg-line-2" />
                <Skeleton className="h-7 w-2/3 rounded-md bg-line" />
              </div>
              <div className="border border-line rounded-md p-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-1/4 rounded bg-line-2" />
                <Skeleton className="h-7 w-1/3 rounded-md bg-line" />
              </div>
            </div>
          </div>

          {/* Aria noticed skeleton card */}
          <div className="rounded-lg p-4 border border-line bg-surface">
            <div className="flex justify-between items-center mb-4">
              <div className="mono text-2xs text-mute-2 uppercase tracking-wider">
                aria noticed
              </div>
              <Skeleton className="h-3 w-16 rounded bg-line-2" />
            </div>

            {/* List of observations */}
            <div className="flex flex-col gap-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-start border-b border-line/60 pb-3 last:border-0 last:pb-0">
                  <Skeleton className="h-5 w-5 rounded-full bg-line-2 flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-3.5 w-full rounded bg-line" />
                    <Skeleton className="h-3 w-5/6 rounded bg-line-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          
          {/* In flight skeleton card */}
          <div className="rounded-lg p-4 border border-line bg-surface">
            <div className="mono mb-4 text-2xs text-mute-2 uppercase tracking-wider">
              in flight
            </div>

            <div className="flex flex-col gap-4">
              {/* Stat breakdown */}
              <div className="flex justify-between items-center border-b border-line pb-2.5">
                <Skeleton className="h-3 w-20 rounded bg-line-2" />
                <Skeleton className="h-4 w-6 rounded bg-line" />
              </div>
              
              {/* Item skeletons */}
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex flex-col gap-1.5 p-2 rounded border border-line-2">
                    <Skeleton className="h-3.5 w-3/4 rounded bg-line" />
                    <div className="flex justify-between items-center mt-1">
                      <Skeleton className="h-3 w-1/3 rounded bg-line-2" />
                      <Skeleton className="h-3 w-8 rounded bg-line-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent activity skeleton card */}
          <div className="rounded-lg p-4 border border-line bg-surface">
            <div className="mono mb-4 text-2xs text-mute-2 uppercase tracking-wider">
              recent activity
            </div>

            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Skeleton className="h-1.5 w-1.5 rounded-full bg-line-3" />
                    <Skeleton className="h-3 w-full rounded bg-line-2" />
                  </div>
                  <Skeleton className="h-3 w-10 rounded bg-line-3 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
