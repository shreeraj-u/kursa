import { Skeleton } from "@kursa/ui/components/skeleton";

export default function LearningLoading() {
  return (
    <div className="flex flex-col gap-6 px-8 pb-8 pt-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-24 rounded bg-line" />
      </div>

      {/* Skill gap card */}
      <div className="rounded-lg border border-line bg-surface p-5 flex flex-col gap-4">
        <Skeleton className="h-4.5 w-40 rounded bg-line" />
        <div className="h-2 w-full rounded-full bg-line-3" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-line bg-bg-sub p-3 flex flex-col gap-2">
              <Skeleton className="h-4 w-1/3 rounded bg-line" />
              <Skeleton className="h-3.5 w-3/4 rounded bg-line-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Learning goals card */}
      <div className="rounded-lg border border-line bg-surface p-5 flex flex-col gap-4">
        <Skeleton className="h-4.5 w-32 rounded bg-line" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-line bg-bg-sub p-3">
              <Skeleton className="h-4 w-1/2 rounded bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
