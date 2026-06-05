import PageHeader from "@/components/dashboard/page-header";
import { Skeleton } from "@kursa/ui/components/skeleton";

export default function ApplicationsLoading() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Applications" />

      <div className="flex flex-col gap-5 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-7 w-44 rounded bg-line" />
            <Skeleton className="h-4 w-2/3 rounded bg-line-2" />
            <div className="mt-1 flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-28 rounded-full bg-line-2" />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-20 rounded-lg bg-line" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Skeleton className="h-4 w-32 rounded bg-line-2" />
              <Skeleton className="h-7 w-28 rounded-md bg-line-2" />
            </div>
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-line bg-bg-sub p-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-md bg-line-2" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-1/2 rounded bg-line" />
                    <Skeleton className="h-3 w-1/3 rounded bg-line-2" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded bg-line-3" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-line bg-surface p-4">
              <Skeleton className="mb-3 h-3 w-16 rounded bg-line-2" />
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-5 w-24 rounded bg-line-2" />
                    <Skeleton className="h-3 w-4 rounded bg-line-3" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4">
              <Skeleton className="mb-3 h-3 w-14 rounded bg-line-2" />
              <Skeleton className="h-3.5 w-full rounded bg-line-2" />
              <Skeleton className="mt-2 h-3.5 w-4/5 rounded bg-line-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
