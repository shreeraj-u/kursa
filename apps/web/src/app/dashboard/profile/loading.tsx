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

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
          {[1, 2, 3].map((section) => (
            <div key={section} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16 rounded bg-line-2" />
                <Skeleton className="h-7 w-40 rounded bg-line" />
                <Skeleton className="h-4 w-72 max-w-full rounded bg-line-2" />
              </div>
              <Skeleton className="h-48 w-full rounded-xl border border-line bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
