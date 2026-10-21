import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint, Segment, SplitSegment } from "@/lib/outreach-data";

const SEG_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"];

export function SegmentsCard({ title, data, unit = "guests reached in total" }: { title: string; data: Segment[]; unit?: string }) {
  const total = data.reduce((a, s) => a + s.count, 0);
  const max = Math.max(...data.map((s) => s.count));
  return (
    <section className="card-surface p-6">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-3 text-4xl font-medium tracking-tight tabular-nums">{total.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{unit}</p>
      <ul className="mt-5 space-y-2">
        {data.map((s, i) => (
          <li key={s.name} className="flex items-center gap-4">
            <div className="flex-1">
              <div className={`truncate rounded-sm px-3 py-1.5 text-primary-foreground shadow-sm ${SEG_COLORS[i % 6]}`} style={{ width: `${Math.max(32, (s.count / max) * 100)}%` }} title={s.name}>{s.name}</div>
            </div>
            <span className="w-12 text-right text-sm tabular-nums">{s.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SplitSegmentsCard({ title, data }: { title: string; data: SplitSegment[] }) {
  const total = data.reduce((a, s) => a + s.text + s.email, 0);
  const max = Math.max(...data.map((s) => s.text + s.email));
  return (
    <section className="card-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium">{title}</h2>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-chart-1" aria-hidden /> Text</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-series-email" aria-hidden /> Email</span>
        </div>
      </div>
      <p className="mt-3 text-4xl font-medium tracking-tight tabular-nums">{total.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">guests reached in total</p>
      <ul className="mt-5 space-y-3.5">
        {data.map((s) => {
          const sum = s.text + s.email;
          const w = Math.max(6, (sum / max) * 100);
          const textW = (s.text / sum) * 100;
          return (
            <li key={s.name}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="truncate text-sm">{s.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{s.text.toLocaleString()} · {s.email.toLocaleString()}</span>
              </div>
              <div className="flex h-3.5 overflow-hidden rounded-sm shadow-sm" style={{ width: `${w}%` }} title={`${s.name}: ${s.text} text · ${s.email} email`} role="img" aria-label={`${s.name}: ${s.text} text, ${s.email} email`}>
                <span className="bg-chart-1" style={{ width: `${textW}%` }} />
                <span className="flex-1 bg-series-email" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function LocationCard({ title }: { title: string }) {
  return (
    <section className="card-surface relative flex min-h-[320px] flex-col p-6">
      <h2 className="text-base font-medium">{title}</h2>
      <div className="relative mt-4 flex-1 overflow-hidden rounded-sm bg-gradient-to-br from-accent via-muted to-accent blur-[1px]" aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="card-surface rounded-md border px-10 py-6 text-center shadow-card">
          <p className="text-sm font-semibold tracking-[0.18em]">COMING SOON</p>
          <p className="mt-1 text-sm text-danger">this feature is under development</p>
        </div>
      </div>
    </section>
  );
}

export function OtaCard() {
  return (
    <section className="card-surface flex flex-col p-6">
      <h2 className="text-base font-medium">OTA guests reached</h2>
      <div className="mt-4 flex gap-2">
        <span className="rounded-sm bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">Expedia</span>
        <span className="rounded-sm bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">Booking.com</span>
      </div>
      <p className="mt-3 text-4xl font-medium tracking-tight tabular-nums">7</p>
      <p className="text-sm text-muted-foreground">OTA guests reached</p>
      <a href="#" onClick={(e) => e.preventDefault()} className="mt-auto pt-4 text-sm text-primary hover:underline">See more on OTA outreach →</a>
    </section>
  );
}

export function DripCard({ value, label = "guests reached in total" }: { value: number; label?: string }) {
  return (
    <section className="card-surface p-6">
      <h2 className="text-base font-medium">Drip campaign results</h2>
      <p className="mt-3 text-4xl font-medium tracking-tight tabular-nums">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </section>
  );
}

export function KpiStrip({ cells }: { cells: { label: string; value: number }[] }) {
  return (
    <section className="card-surface grid divide-y p-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {cells.map((c) => (
        <div key={c.label} className="py-3 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
          <p className="text-4xl font-medium tracking-tight tabular-nums">{c.value.toLocaleString()}</p>
          <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </section>
  );
}

export interface SeriesDef { key: keyof DayPoint; label: string; color: string; dashed?: boolean; axis: "left" | "right" }

export function ActivityChart({ title, data, defs, note }: { title: string; data: DayPoint[]; defs: SeriesDef[]; note?: string }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <section className="card-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">{title}</h2>
          {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
        </div>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Chart series">
          {defs.map((d) => {
            const off = hidden.has(d.key as string);
            return (
              <button key={d.key as string} onClick={() => toggle(d.key as string)} aria-pressed={!off}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted ${off ? "opacity-40 line-through" : ""}`}>
                <svg width="20" height="8" aria-hidden><line x1="0" y1="4" x2="20" y2="4" stroke={d.color} strokeWidth="2" strokeDasharray={d.dashed ? "4 3" : undefined} /><circle cx="10" cy="4" r="2.5" fill={d.color} /></svg>
                <span style={{ color: d.color }}>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -10, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: 0, borderRadius: 3, fontSize: 12, boxShadow: "0 8px 24px oklch(0.3 0.02 260 / 0.3)" }} labelStyle={{ color: "var(--popover-foreground)" }} />
            {defs.map((d) => (
              <Line key={d.key as string} yAxisId={d.axis} type="monotone" dataKey={d.key as string} name={d.label} stroke={d.color} strokeWidth={2}
                strokeDasharray={d.dashed ? "5 4" : undefined} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} hide={hidden.has(d.key as string)} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-medium tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
