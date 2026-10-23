import { Skeleton } from "@/components/ui/skeleton";

export default function LeadDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="space-y-2 rounded-xl border p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-3 rounded-xl border p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}
