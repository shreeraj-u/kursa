import PageHeader from "@/components/dashboard/page-header";
import { Skeleton } from "@kursa/ui/components/skeleton";

export default function ResumeLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Resume studio" />
      <div className="px-8 pt-6 pb-8 flex flex-col gap-4 flex-1">
        
        {/* Toolbar block */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
          <Skeleton className="h-4 w-40 rounded bg-line" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16 rounded bg-line-3" />
            <Skeleton className="h-7 w-16 rounded bg-line-2" />
            <Skeleton className="h-7 w-28 rounded bg-line-2" />
            <Skeleton className="h-7 w-24 rounded bg-line-2" />
            <Skeleton className="h-7 w-20 rounded bg-line" />
          </div>
        </div>

        {/* Version indicators row */}
        <div className="flex items-center gap-3 border-b border-line pb-2">
          {[1, 2].map((v) => (
            <Skeleton key={v} className="h-4 w-12 rounded bg-line-2" />
          ))}
          <Skeleton className="h-3 w-16 rounded bg-line-3 ml-auto" />
        </div>

        {/* Body grid: document + ATS panel */}
        <div className="grid grid-cols-[1fr_280px] gap-5 max-lg:flex max-lg:flex-col">
          
          {/* Left Column: Mock paper resume */}
          <div className="rounded-lg p-6 bg-bg-sub overflow-auto flex flex-col gap-6">
            
            {/* Header section */}
            <div className="flex flex-col items-center gap-2 text-center pb-2 border-b border-line/60">
              <Skeleton className="h-5 w-40 rounded bg-line mx-auto" />
              <Skeleton className="h-3 w-64 rounded bg-line-2 mx-auto" />
            </div>

            {/* Summary section */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20 rounded bg-line" />
              <Skeleton className="h-3 w-full rounded bg-line-2" />
              <Skeleton className="h-3 w-full rounded bg-line-2" />
              <Skeleton className="h-3 w-4/5 rounded bg-line-2" />
            </div>

            {/* Experience section */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-24 rounded bg-line" />
              
              {/* Job 1 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3.5 w-1/3 rounded bg-line-2" />
                  <Skeleton className="h-3 w-20 rounded bg-line-3" />
                </div>
                <Skeleton className="h-3 w-full rounded bg-line-3" />
                <Skeleton className="h-3 w-5/6 rounded bg-line-3" />
              </div>

              {/* Job 2 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3.5 w-1/4 rounded bg-line-2" />
                  <Skeleton className="h-3 w-20 rounded bg-line-3" />
                </div>
                <Skeleton className="h-3 w-full rounded bg-line-3" />
                <Skeleton className="h-3 w-4/5 rounded bg-line-3" />
              </div>
            </div>

            {/* Skills section */}
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-16 rounded bg-line" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="h-5 w-16 rounded bg-line-2" />
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: ATS statistics panels */}
          <div className="flex flex-col gap-4">
            
            {/* ATS Score card */}
            <div className="rounded-lg p-4 border border-line bg-surface flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full flex-shrink-0 w-[38px] h-[38px] border-2 border-line-2 bg-surface">
                <Skeleton className="h-4 w-4 rounded bg-line-2" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24 rounded bg-line" />
                <Skeleton className="h-3 w-32 rounded bg-line-3" />
              </div>
            </div>

            {/* Suggestions list */}
            <div className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-3">
              <div className="mono text-2xs text-mute-2 uppercase tracking-wider">
                suggestions
              </div>
              <div className="flex flex-col gap-3 mt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Skeleton className="h-1.5 w-1.5 rounded-full bg-line-3 flex-shrink-0 mt-1" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-3/4 rounded bg-line" />
                      <Skeleton className="h-3 w-5/6 rounded bg-line-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
