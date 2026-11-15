import type { ReactNode } from "react";

/** A placeholder block; size it with utility classes (`h-4 w-3/5`). Decorative, so hidden from screen readers. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={className ? `sk-skeleton ${className}` : "sk-skeleton"}
    />
  );
}

/** The screen-reader status every loading region announces once. */
export function LoadingStatus() {
  return (
    <p className="sr-only" role="status">
      Memuat…
    </p>
  );
}

/**
 * A route skeleton on the real page frame (`sk-page` plus the route's own class), with the
 * eyebrow, title and lede of `.sk-page-head`, so the page swaps in without a jump.
 */
export function PageSkeleton({
  className,
  head = true,
  children,
}: {
  className: string;
  head?: boolean;
  children: ReactNode;
}) {
  return (
    <article className={`sk-page ${className}`} aria-busy="true">
      <div className="wrap">
        <LoadingStatus />
        {head ? (
          <div className="sk-page-head">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-11 w-4/5 max-w-[520px]" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full max-w-[62ch]" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </article>
  );
}

/** A `.sk-card` with a heading bar; the body mirrors the card it stands in for. */
export function CardSkeleton({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={className ? `sk-card ${className}` : "sk-card"}>
      <Skeleton className="h-5 w-2/5" />
      {children ?? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      )}
    </div>
  );
}
