import { Skeleton } from "@kursa/ui/components/skeleton";

export default function SkillsLoading() {
  return (
    <div className="flex flex-col gap-6 pt-6 px-8 pb-8">
      {/* Title block - no PageHeader matching skills/page.tsx */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-24 rounded bg-line" />
        <Skeleton className="h-4 w-96 rounded bg-line-2" />
      </div>

      {/* Grid layout matching skills-studio.tsx */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Left Column: Inventory & Goals */}
        <div className="flex flex-col gap-6">
          
          {/* Skill Inventory Card */}
          <div className="rounded-lg p-5 border border-line bg-surface flex flex-col gap-4">
            <Skeleton className="h-4.5 w-32 rounded bg-line" />
            <Skeleton className="h-9 w-full rounded border border-line bg-surface" />
            <div className="flex flex-wrap gap-2.5 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <Skeleton key={i} className="h-6 w-16 rounded bg-line-2" />
              ))}
            </div>
          </div>

          {/* Learning Goals Card */}
          <div className="rounded-lg p-5 border border-line bg-surface flex flex-col gap-4">
            <Skeleton className="h-4.5 w-32 rounded bg-line" />
            <Skeleton className="h-9 w-full rounded border border-line bg-surface" />
            <div className="flex flex-col gap-3.5 mt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="h-4.5 w-4.5 rounded border border-line bg-surface flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-1/2 rounded bg-line" />
                    <Skeleton className="h-3 w-20 rounded bg-line-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Skill Gap Panel */}
        <div className="rounded-lg p-5 border border-line bg-surface flex flex-col gap-4">
          <Skeleton className="h-4.5 w-32 rounded bg-line" />
          <Skeleton className="h-3.5 w-full rounded bg-line-2" />
          
          {/* Progress bar mock */}
          <div className="flex items-center gap-3 mt-2">
            <Skeleton className="h-4.5 w-8 rounded bg-line-2 flex-shrink-0" />
            <div className="h-2 w-full rounded-full bg-line-3 relative overflow-hidden" />
          </div>

          {/* Gap elements list */}
          <div className="flex flex-col gap-3 mt-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-line rounded-md p-3 flex flex-col gap-2.5 bg-bg-sub">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3 rounded bg-line" />
                  <Skeleton className="h-4 w-12 rounded bg-line-2" />
                </div>
                <Skeleton className="h-3.5 w-3/4 rounded bg-line-3" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
