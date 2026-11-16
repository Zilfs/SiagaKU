import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";
import { FloodTrendSkeleton } from "@/features/risk/components/flood-trend-chart";
import { JakartaSummarySkeleton } from "@/features/risk/components/jakarta-summary";
import { DashCardsSkeleton } from "@/features/risk/components/map-dashboard";

/** The dashboard while districts load: the head (legend and location button), the live bar, map beside the cards, then the list. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-peta" head={false}>
      <div className="sk-page-head">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="sk-skel-title w-4/5 max-w-[520px]" />
        <Skeleton className="h-6 w-full max-w-[44ch]" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <Skeleton className="h-12 w-44" />
      </div>
      <div className="sk-dash">
        <div className="sk-dash__bar">
          <Skeleton className="h-5 w-72 max-w-full" />
          <Skeleton className="h-11 w-40" />
        </div>
        <div className="sk-dash__grid">
          <div className="sk-dash__main">
            <div className="sk-map-shell sk-dash__map">
              <Skeleton className="sk-map rounded-none" />
            </div>
            <div className="sk-dash__bottom">
              <JakartaSummarySkeleton />
              <FloodTrendSkeleton />
            </div>
          </div>
          <div className="sk-dash__aside">
            <DashCardsSkeleton />
          </div>
        </div>
      </div>
      <div className="sk-peta__list">
        <Skeleton className="h-6 w-48" />
        <div className="sk-district-list">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="my-1.5 h-12 w-full" />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
