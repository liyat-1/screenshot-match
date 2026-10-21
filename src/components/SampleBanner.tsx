import type { ReactNode } from "react";

export function SampleBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-sm border border-dashed border-sample bg-sample-soft px-4 py-2.5 text-sample">
      <span className="text-xs font-medium uppercase tracking-wide">Prototype · illustrative data</span>
      {children}
    </div>
  );
}
