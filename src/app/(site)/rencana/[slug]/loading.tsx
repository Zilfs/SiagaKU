import { CardSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** A saved plan while it loads: crumbs, the head with share actions, the summary, then the plan cards. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-plan-page" head={false}>
      <div className="sk-crumbs">
        <Skeleton className="h-[1lh] w-56" />
      </div>
      <div className="sk-plan-head">
        <div>
          <Skeleton className="h-4 w-44" />
          <Skeleton className="sk-skel-title w-[min(440px,80vw)]" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-11 w-56" />
      </div>
      <CardSkeleton className="sk-plan-summary" />
      <div className="sk-plan-grid">
        <CardSkeleton className="sk-checklist-card" />
        <CardSkeleton className="sk-plan-tabs" />
        <CardSkeleton className="sk-plan-contacts" />
      </div>
    </PageSkeleton>
  );
}
