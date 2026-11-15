import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

/** The landing while its district list loads: the hero triptych, then the search panel of #cek. */
export default function Loading() {
  return (
    <>
      <LoadingStatus />
      <section className="hero hero--triptych sk-hero" aria-busy="true">
        <div className="wrap">
          <div className="hero-text grid hero__grid">
            <div className="span-3 flex flex-col gap-3">
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-10 w-3/5" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="span-6 ly-collage rounded-2xl" />
            <div className="span-3 hero__cta">
              <Skeleton className="h-16 w-56 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-busy="true">
        <div className="wrap">
          <div className="section-head section-head--split">
            <div>
              <Skeleton className="h-9 w-[min(520px,100%)]" />
              <Skeleton className="h-4 w-[min(460px,100%)]" />
            </div>
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="sk-fill">
            <div className="sk-app">
              <div className="sk-app__side flex flex-col gap-3 p-5">
                <Skeleton className="h-12 w-full" />
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
              <div className="sk-app__main p-5">
                <Skeleton className="h-full min-h-60 w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
