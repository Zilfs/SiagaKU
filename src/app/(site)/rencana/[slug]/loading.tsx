import { CardSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** A saved plan while it loads: crumbs, the head with share actions, the summary, then the plan cards. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-plan-page" head={false}>
      <Skeleton className="mb-6 h-4 w-56" />
      <div className="sk-plan-head">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-11 w-[min(440px,80vw)]" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-56" />
      </div>
      <CardSkeleton className="sk-plan-summary" />
      <div className="sk-plan-grid">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </PageSkeleton>
  );
}
