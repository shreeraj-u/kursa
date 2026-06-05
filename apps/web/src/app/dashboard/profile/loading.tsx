import PageHeader from "@/components/dashboard/page-header";
import { Skeleton } from "@kursa/ui/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader pageTitle="Profile" />
      <div className="flex flex-col gap-8 px-8 pb-8 pt-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-28 rounded bg-line" />
          <Skeleton className="h-4 w-96 max-w-full rounded bg-line-2" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full bg-line-2" />
            <Skeleton className="h-6 w-24 rounded-full bg-line-2" />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          {[1, 2, 3, 4, 5].map((section) => (
            <div key={section} className="rounded-xl border border-line bg-surface overflow-hidden">
              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-3 w-16 rounded bg-line-2" />
                  <Skeleton className="h-7 w-40 rounded bg-line" />
                  <Skeleton className="h-4 w-72 max-w-full rounded bg-line-2" />
                </div>
                <Skeleton className="h-5 w-5 rounded bg-line-2 shrink-0" />
              </div>
              <div className="border-t border-line px-6 pb-6 pt-5">
                <Skeleton className="h-40 w-full rounded-xl bg-bg-sub" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
