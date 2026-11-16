import { CardSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

/** The about page while it loads: the section index, then the method cards. */
export default function Loading() {
  return (
    <PageSkeleton className="sk-about">
      <Skeleton className="mb-7 h-10 w-full max-w-[640px]" />
      <div className="sk-about__grid">
        <CardSkeleton className="sk-about__section sk-about__wide" />
        <CardSkeleton className="sk-about__section sk-about__narrow" />
        <CardSkeleton className="sk-about__section sk-about__broad" />
        <CardSkeleton className="sk-about__section" />
      </div>
    </PageSkeleton>
  );
}
