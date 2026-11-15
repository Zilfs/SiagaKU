import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** The map while districts load: the head with legend, the map frame, then the district list. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-peta">
      <div className="sk-map-shell">
        <Skeleton className="sk-map rounded-none" />
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
