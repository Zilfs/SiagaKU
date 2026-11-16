import { CardSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** The chat page while it loads: the chat frame, then the two aside cards. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-tanya">
      <div className="sk-tanya__grid">
        {/* .sk-chat rows: head, messages, composer */}
        <div className="sk-chat gap-4 p-5">
          <Skeleton className="h-6 w-2/5" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 self-end" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="sk-tanya__aside">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </PageSkeleton>
  );
}
