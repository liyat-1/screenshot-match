import type { ReactNode } from "react";

export function SampleBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-5 rounded-sm border border-sample/40 bg-sample-soft px-4 py-2.5 text-sm">
      <p className="font-medium text-sample">Clickable prototype · sample data, not live figures</p>
      <p className="mt-0.5 text-xs text-foreground/70">Open questions 1–6 resolved per the recommendation, pending Huseyin sign-off.</p>
      {children && <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">{children}</div>}
    </div>
  );
}

/** Visible design annotation (ANNOTATE in the brief). */
export function Annotate({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-sm border border-dashed border-sample/50 bg-sample-soft/60 px-3 py-1.5 text-xs text-foreground/80">
      <span className="mr-1.5 font-medium uppercase tracking-wide text-sample">Note</span>
      {children}
    </p>
  );
}
