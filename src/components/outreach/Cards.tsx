import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint, Segment } from "@/lib/outreach-data";

const SEG_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"];

export function SegmentsCard({ title, data, unit = "guests reached in total" }: { title: string; data: Segment[]; unit?: string }) {
  const total = data.reduce((a, s) => a + s.count, 0);
  const max = Math.max(...data.map((s) => s.count));
  return (
    <section className="card-surface p-6">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-4 text-4xl font-medium">{total.toLocaleString()}</p>
      <p className="text-muted-foreground">{unit}</p>
      <ul className="mt-5 space-y-2">
        {data.map((s, i) => (
          <li key={s.name} className="flex items-center gap-4">
            <div className="flex-1">
              <div className={`truncate rounded-full px-3 py-1.5 text-primary-foreground ${SEG_COLORS[i % 6]}`} style={{ width: `${Math.max(32, (s.count / max) * 100)}%` }} title={s.name}>{s.name}</div>
            </div>
            <span className="w-12 text-right tabular-nums">{s.count.toLocaleString()}</span>
          </li>
        ))}
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
        <div className="card-surface px-10 py-5 text-center">
          <p className="text-xl font-medium tracking-wide">COMING SOON</p>
          <p className="text-danger">this feature is under development</p>
        </div>
      </div>
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
                className={`flex items-center gap-1.5 rounded-sm px-1 text-sm hover:bg-muted ${off ? "opacity-40 line-through" : ""}`}>
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
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: 0, borderRadius: 4, fontSize: 12 }} labelStyle={{ color: "var(--popover-foreground)" }} />
            {defs.map((d) => (
              <Line key={d.key as string} yAxisId={d.axis} type="monotone" dataKey={d.key as string} name={d.label} stroke={d.color} strokeWidth={2}
                strokeDasharray={d.dashed ? "5 4" : undefined} dot={false} hide={hidden.has(d.key as string)} />
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
