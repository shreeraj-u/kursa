import PageHeader from "@/components/dashboard/page-header";
import { Skeleton } from "@kursa/ui/components/skeleton";

export default function JournalLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Journal" />

      <div className="flex flex-col gap-5 px-8 pb-8 pt-6">
        {/* Header Title block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-7 w-36 rounded bg-line" />
            <Skeleton className="h-4 w-2/3 rounded bg-line-2" />
            <Skeleton className="h-3 w-24 rounded bg-line-3 mt-1" />
          </div>
          <Skeleton className="h-6 w-48 rounded-full bg-line-2 self-start sm:self-auto mt-2 sm:mt-0" />
        </div>

        {/* Grid layout matching journal-client.tsx */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          
          {/* Left Column: Compose & Timeline */}
          <div className="flex flex-col gap-4 min-w-0">
            
            {/* JournalCompose placeholder */}
            <div className="rounded-lg p-5 border border-line bg-surface flex flex-col gap-4">
              {/* Type tabs (Note, Win, Feedback, Learning) */}
              <div className="flex gap-2 border-b border-line pb-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-12 rounded bg-line-2" />
                ))}
              </div>
              <Skeleton className="h-20 w-full rounded bg-line-2" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-32 rounded bg-line-3" />
                <Skeleton className="h-7 w-20 rounded bg-line-2" />
              </div>
            </div>

            {/* Timeline & Review Tabs container */}
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex px-4 border-b border-line gap-4 py-2.5">
                <Skeleton className="h-4 w-16 rounded bg-line" />
                <Skeleton className="h-4 w-20 rounded bg-line-2" />
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Timeline filter mock */}
                <div className="flex justify-between items-center pb-2">
                  <Skeleton className="h-4 w-24 rounded bg-line-2" />
                  <Skeleton className="h-4 w-32 rounded bg-line-3" />
                </div>

                {/* Entry skeletons list */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-start border-b border-line/60 pb-4 last:border-0 last:pb-0"
                  >
                    <Skeleton className="h-8 w-8 rounded-full bg-line-2 flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-1/3 rounded bg-line" />
                        <Skeleton className="h-3 w-12 rounded bg-line-3" />
                      </div>
                      <Skeleton className="h-3.5 w-full rounded bg-line-2" />
                      <Skeleton className="h-3 w-5/6 rounded bg-line-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Sidebar */}
          <div className="flex flex-col gap-4">
            
            {/* Checkin card */}
            <div className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-3">
              <Skeleton className="h-3.5 w-1/2 rounded bg-line" />
              <Skeleton className="h-3 w-3/4 rounded bg-line-2" />
              <Skeleton className="h-7 w-full rounded bg-line-2 mt-1" />
            </div>

            {/* Relevance summary */}
            <div className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-3">
              <div className="mono text-2xs text-mute-2 uppercase tracking-wider">
                relevance
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-full rounded bg-line-2" />
                <Skeleton className="h-3.5 w-5/6 rounded bg-line-2" />
                <Skeleton className="h-3.5 w-4/5 rounded bg-line-2" />
              </div>
            </div>

            {/* Memories panel */}
            <div className="rounded-lg p-4 border border-line bg-surface flex flex-col gap-3">
              <div className="mono text-2xs text-mute-2 uppercase tracking-wider">
                memories
              </div>
              <div className="flex flex-col gap-3 mt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Skeleton className="h-1.5 w-1.5 rounded-full bg-line-3 flex-shrink-0" />
                    <Skeleton className="h-3.5 w-full rounded bg-line-2" />
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
