import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Citizen reports while the page loads: the head with its button, then the report map. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-laporan-page" head={false}>
      <div className="sk-page-head">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="sk-skel-title w-4/5 max-w-[520px]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full max-w-[62ch]" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="h-12 w-44" />
      </div>
      <div className="sk-map-shell sk-map-shell--reports">
        <Skeleton className="sk-map rounded-none" />
      </div>
    </PageSkeleton>
  );
}
