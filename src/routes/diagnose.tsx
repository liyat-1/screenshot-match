import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SampleBanner } from "@/components/SampleBanner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type DState = "investigation" | "no_plan" | "no_row" | "zero_eligible" | "missing_fields";
const LABELS: Record<DState, string> = {
  investigation: "Example investigation",
  no_plan: "No Email plan",
  no_row: "No warmup row",
  zero_eligible: "Zero email-eligible guests",
  missing_fields: "Missing diagnostic fields",
};

interface Warmup {
  Status: string | null; DailyLimit: number | null; MonthlyLimit: number | null;
  LastBounceRate: number | null; LastSpamRate: number | null; LastUnsubscribeRate: number | null;
  LastEvaluatedOn: string | null; LastStepDownOn: string | null; PausedOn: string | null; ConsecutiveHealthyEvaluations: number | null;
}
const FULL: Warmup = {
  Status: "SteppedDown", DailyLimit: 500, MonthlyLimit: 200000, LastBounceRate: 0.064, LastSpamRate: 0.0004, LastUnsubscribeRate: 0.0071,
  LastEvaluatedOn: "2026-10-20T06:00:00", LastStepDownOn: "2026-10-18T06:00:00", PausedOn: null, ConsecutiveHealthyEvaluations: 1,
};
const SCEN: Record<DState, { plan: boolean; warmup: Warmup | null; emailEligible: number | null; textEligible: number }> = {
  investigation: { plan: true, warmup: FULL, emailEligible: 8042, textEligible: 5310 },
  no_plan: { plan: false, warmup: null, emailEligible: null, textEligible: 5310 },
  no_row: { plan: true, warmup: null, emailEligible: 8042, textEligible: 5310 },
  zero_eligible: { plan: true, warmup: { ...FULL, Status: "Healthy", DailyLimit: 250, LastStepDownOn: null, ConsecutiveHealthyEvaluations: 0, LastBounceRate: null, LastSpamRate: null, LastUnsubscribeRate: null, LastEvaluatedOn: null }, emailEligible: 0, textEligible: 5310 },
  missing_fields: { plan: true, warmup: { ...FULL, LastSpamRate: null, LastEvaluatedOn: null }, emailEligible: 8042, textEligible: 5310 },
};

export const Route = createFileRoute("/diagnose")({
  validateSearch: (s: Record<string, unknown>): { state: DState } => ({ state: ((s.state as string) in SCEN ? s.state : "investigation") as DState }),
  head: () => ({
    meta: [
      { title: "Diagnose — Email reputation & sending | Directful Internal" },
      { name: "description", content: "Internal CSM view of email eligibility, warmup status, limits and reputation signals." },
      { property: "og:title", content: "Diagnose — Email reputation & sending | Directful Internal" },
      { property: "og:description", content: "Internal CSM view of email eligibility, warmup status, limits and reputation signals." },
    ],
  }),
  component: Diagnose,
});

const pct = (v: number | null) => (v == null ? null : `${(v * 100).toFixed(2)}%`);
const dt = (v: string | null) => (v == null ? null : new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }));
const READABLE: Record<string, string> = { Healthy: "Healthy", SteppedDown: "At risk", Paused: "Paused" };

function Row({ label, value, unit, def }: { label: string; value: string | number | null; unit?: string; def: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {label}
        <Tooltip>
          <TooltipTrigger aria-label={`About ${label}`} className="text-muted-foreground hover:text-primary"><Info className="size-3.5" /></TooltipTrigger>
          <TooltipContent className="max-w-64">{def}</TooltipContent>
        </Tooltip>
      </dt>
      <dd className="text-right font-mono text-[13px] tabular-nums">
        {value == null ? (
          <Tooltip><TooltipTrigger className="text-muted-foreground">—</TooltipTrigger><TooltipContent>No recorded value</TooltipContent></Tooltip>
        ) : (<>{typeof value === "number" ? value.toLocaleString() : value}{unit && <span className="ml-1 text-muted-foreground">{unit}</span>}</>)}
      </dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      <dl className="mt-2">{children}</dl>
    </div>
  );
}

function Diagnose() {
  const { state } = Route.useSearch();
  const navigate = useNavigate({ from: "/diagnose" });
  const s = SCEN[state];
  const w = s.warmup;
  return (
    <AppShell crumb="Diagnose · Hellas Gadgets Kallithea" active="diagnose">
      <SampleBanner>
        <label className="flex items-center gap-2 text-sm">Scenario
          <select className="rounded-sm border border-sample bg-card px-2 py-1 text-foreground" value={state} onChange={(e) => navigate({ search: { state: e.target.value as DState } })}>
            {Object.entries(LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </SampleBanner>

      <h2 className="text-base font-medium">Eligibility</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-muted-foreground">Eligible for Text/SMS</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{s.textEligible.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">guests · current</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-muted-foreground">Eligible for Email</p>
          {!s.plan ? (
            <><p className="mt-1 text-2xl font-medium text-muted-foreground">Not applicable</p><p className="text-xs text-muted-foreground">No Email plan 140</p></>
          ) : (
            <><p className="mt-1 text-2xl font-medium tabular-nums">{s.emailEligible!.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{s.emailEligible === 0 ? "No guests currently meet the Email eligibility rules" : "guests · current"}</p></>
          )}
        </div>
        <div className="rounded-sm border border-dashed p-5 text-xs text-muted-foreground">
          Eligible guests is an audience size. The daily sending limit is a per-day cap on emails sent — they measure different things.
        </div>
      </div>

      <h2 className="mt-8 text-base font-medium">Email reputation & sending diagnostics</h2>
      {!s.plan ? (
        <div className="card-surface mt-3 p-5">
          <p className="font-medium">This hotel doesn't have Email plan 140</p>
          <p className="mt-1 text-muted-foreground">A warmup record isn't expected for hotels without the Email subscription. This is not a system failure.</p>
        </div>
      ) : !w ? (
        <div className="mt-3 flex gap-3 rounded-sm border border-warning bg-warning-soft p-5 text-warning">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Warmup record missing</p>
            <p className="mt-1 text-foreground/80">The hotel has Email plan 140 but no SubsidiaryEmailWarmupStates row. Status and limits are unknown — no default has been substituted. Flag for engineering (data initialization).</p>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <Group title="Current status & limits">
            <Row label="Status (raw)" value={w.Status ? `${w.Status}${READABLE[w.Status] ? ` · ${READABLE[w.Status]}` : ""}` : null} def="Raw warmup status from the data source, with the client-facing label." />
            <Row label="Daily limit" value={w.DailyLimit} unit="emails/day" def="Current cap for the hotel-local day. Starts at 250, +250 per healthy evaluation, halves on step-down (floor 250)." />
            <Row label="Monthly limit" value={w.MonthlyLimit} unit="emails/mo" def="Monthly hard cap." />
          </Group>
          <Group title="Last evaluated signals">
            <Row label="Bounce rate" value={pct(w.LastBounceRate)} def="Step-down at 5–10%; pause above 10% or on any reputation bounce." />
            <Row label="Spam rate" value={pct(w.LastSpamRate)} def="Step-down above 0.1%." />
            <Row label="Unsubscribe rate" value={pct(w.LastUnsubscribeRate)} def="Step-down above 1%." />
            <Row label="Last evaluated on" value={dt(w.LastEvaluatedOn)} def="Hotel-local time of the last evaluation. Requires at least 50 sends in 24 hours." />
          </Group>
          <Group title="Limit changes & recovery">
            <Row label="Last step-down on" value={dt(w.LastStepDownOn)} def="When the limit was last reduced by 50%." />
            <Row label="Paused on" value={dt(w.PausedOn)} def="When sending was paused. Missing does not by itself confirm sending is active." />
            <Row label="Consecutive healthy evals" value={w.ConsecutiveHealthyEvaluations} unit="(internal)" def="Internal counter. A pause lifts after 2 consecutive healthy evaluations." />
          </Group>
        </div>
      )}
    </AppShell>
  );
}
