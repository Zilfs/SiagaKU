import { CardSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** The report form while districts load: the form card, then the how-it-works aside. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-lapor-page">
      <div className="sk-lapor-grid">
        <CardSkeleton>
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-44" />
        </CardSkeleton>
        <CardSkeleton />
      </div>
    </PageSkeleton>
  );
}
