import { CardSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Early warning while it loads: the watch card, then the how-it-works card. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-alert-page">
      <div className="sk-alert-grid">
        <CardSkeleton>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-44" />
        </CardSkeleton>
        <CardSkeleton />
      </div>
    </PageSkeleton>
  );
}
