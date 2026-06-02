import PageHeader from "@/components/dashboard/page-header";
import { Skeleton } from "@kursa/ui/components/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Settings" />
      <div className="pt-6 px-8 pb-8">
        <div className="flex gap-8 min-h-[calc(100vh-44px)]">
          
          {/* Left Column: Settings Navigation */}
          <div className="w-[180px] shrink-0 flex flex-col gap-4">
            <div className="flex flex-col gap-2 pb-4 border-b border-line">
              <Skeleton className="h-4.5 w-24 rounded bg-line" />
              <Skeleton className="h-3.5 w-32 rounded bg-line-2" />
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-4 w-3/4 rounded bg-line-2" />
              ))}
            </div>
          </div>

          {/* Right Column: Settings profile form content */}
          <div className="flex-1 max-w-[640px] flex flex-col gap-6">
            
            {/* Section Header */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-36 rounded bg-line" />
              <Skeleton className="h-3.5 w-72 rounded bg-line-2" />
            </div>

            {/* Profile fields form skeleton */}
            <div className="flex flex-col gap-5 mt-2">
              {/* Field 1 */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16 rounded bg-line-2" />
                <Skeleton className="h-9 w-full rounded border border-line bg-surface" />
              </div>
              {/* Field 2 */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16 rounded bg-line-2" />
                <Skeleton className="h-9 w-full rounded border border-line bg-surface" />
              </div>
              {/* Field 3 */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20 rounded bg-line-2" />
                <Skeleton className="h-20 w-full rounded border border-line bg-surface" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <Skeleton className="h-7 w-20 rounded bg-line-2" />
              <Skeleton className="h-7 w-16 rounded bg-line-3" />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
