import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** The plan wizard while districts load: the three steps, then the first step's panel. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-rencana">
      <div className="sk-wizard">
        <div className="sk-wizard__steps">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[54px] w-full rounded-xl" />
          ))}
        </div>
        <div className="sk-wizard__panel">
          <Skeleton className="h-6 w-2/5" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-40 justify-self-end" />
        </div>
      </div>
    </PageSkeleton>
  );
}
