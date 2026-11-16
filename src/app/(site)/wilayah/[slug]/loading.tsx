import { CardSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** A district while its risk detail loads: crumbs, the head with the score card, then the card grid. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-detail" head={false}>
      <Skeleton className="mb-6 h-4 w-56" />
      <div className="sk-detail-head">
        <div className="sk-detail-head__copy">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="sk-skel-title w-3/5" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full max-w-[58ch]" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
        <div className="sk-detail-score">
          <Skeleton className="size-[148px] rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="sk-detail-grid">
        <CardSkeleton className="sk-explain" />
        <CardSkeleton className="sk-breakdown" />
        <CardSkeleton className="sk-weather" />
        <CardSkeleton className="sk-history" />
        <CardSkeleton className="sk-safepoints" />
      </div>
    </PageSkeleton>
  );
}
