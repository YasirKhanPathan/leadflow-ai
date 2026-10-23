import { Skeleton } from "@/components/ui/skeleton";

export default function FollowUpsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2 rounded-lg border p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
        ))}
      </div>
    </div>
  );
}
