import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, History, Info } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Annotate, SampleBanner } from "@/components/SampleBanner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  EMAIL_SCENARIOS, EMAIL_STATE_LABELS, WARMUP, clientCopy, clientLabel, fmtDate,
  remainingToday, usageTone, whyThisLimit, HOTEL_NAME, type EmailScenario, type EmailState,
} from "@/lib/outreach-data";

export const Route = createFileRoute("/diagnose")({
  validateSearch: (s: { state?: unknown }) => ({
    state: (typeof s.state === "string" && Object.hasOwn(EMAIL_SCENARIOS, s.state) ? s.state : "healthy") as EmailState,
  }),
  head: () => ({
    meta: [
      { title: "Diagnose — Email reputation & sending | Directful Internal" },
      { name: "description", content: "Internal CSM view of email eligibility, warmup status, limits and reputation signals." },
      { property: "og:title", content: "Diagnose — Email reputation & sending | Directful Internal" },
      { property: "og:description", content: "Internal CSM view of email eligibility, warmup status, limits and reputation signals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Diagnose,
});

const VERDICT_TONES = { OK: "bg-success-soft text-success", "Step-down": "bg-warning-soft text-warning", Pause: "bg-danger-soft text-danger", "No data": "bg-muted text-muted-foreground" } as const;
const SUBSIDIARY_ID = "4821";
const SUBSIDIARY_PLAN = "140";
const ADO_TICKET = "ADO #31639";

function bounceVerdict(v: number | null) {
  if (v == null) return "No data";
  if (v > 0.1) return "Pause";
  if (v >= 0.05) return "Step-down";
  return "OK";
}
function spamVerdict(v: number | null) {
  if (v == null) return "No data";
  return v > 0.001 ? "Step-down" : "OK";
}
function unsubVerdict(v: number | null) {
  if (v == null) return "No data";
  return v > 0.01 ? "Step-down" : "OK";
}

function Meter({ label, value, max, zones, verdict }: { label: string; value: number | null; max: number; zones: { to: number; cls: string }[]; verdict: string }) {
  const pct = value == null ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono tabular-nums">{value == null ? "—" : `${(value * 100).toFixed(2)}%`}</span>
          <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${VERDICT_TONES[verdict as keyof typeof VERDICT_TONES]}`}>{verdict}</span>
        </span>
      </div>
      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        {zones.map((z, i) => <div key={i} className={z.cls} style={{ width: `${(z.to / max) * 100}%` }} />)}
      </div>
      {value != null && <div className="relative h-0" aria-hidden><span className="absolute -top-[11px] h-3 w-0.5 bg-foreground" style={{ left: `calc(${pct}% - 1px)` }} /></div>}
    </div>
  );
}

function RampScale({ limit }: { limit: number }) {
  const pct = ((limit - WARMUP.initialDailyLimit) / (WARMUP.approxMaxDaily - WARMUP.initialDailyLimit)) * 100;
  const ticks = [WARMUP.initialDailyLimit, 2500, 5000, WARMUP.approxMaxDaily];
  return (
    <div className="mt-1">
      <div className="relative h-2 rounded-full bg-muted" aria-hidden>
        <div className="absolute inset-y-0 left-0 rounded-full bg-info" style={{ width: `${pct}%` }} />
        <span className="absolute -top-1 h-4 w-1 rounded-sm bg-foreground" style={{ left: `calc(${pct}% - 2px)` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {ticks.map((t) => <span key={t}>{t.toLocaleString()}</span>)}
      </div>
      <p className="sr-only">Daily limit {limit.toLocaleString()} on a ramp from {WARMUP.initialDailyLimit} to about {WARMUP.approxMaxDaily.toLocaleString()} emails per day</p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ChannelTag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-info-soft px-2 py-0.5 text-[11px] font-medium text-info">{children}</span>;
}

function CopyExplanation({ state }: { state: EmailState }) {
  const [copied, setCopied] = useState(false);
  const copy = clientCopy(state);
  const text = `${copy.headline}${copy.support ? `\n\n${copy.support}` : ""}`;
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={onCopy} className="flex shrink-0 items-center gap-1.5 rounded-sm border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent">
      {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : "Copy client explanation"}
    </button>
  );
}

function Diagnose() {
  const { state } = Route.useSearch();
  const navigate = useNavigate({ from: "/diagnose" });
  const s = EMAIL_SCENARIOS[state];
  const seen = clientLabel(s.raw, s.evaluated);
  const remaining = s.dailyLimit != null && s.sentToday != null ? remainingToday(s.dailyLimit, s.sentToday, s.raw) : null;
  const monthlyPct = s.monthlySent != null ? Math.min(100, (s.monthlySent / s.monthlyLimit) * 100) : null;
  const usage = s.dailyLimit != null && s.sentToday != null ? usageTone(s.sentToday, s.dailyLimit) : "grey";
  const barFill = usage === "grey" ? "bg-muted-foreground/40" : usage === "amber" ? "bg-warning" : "bg-primary";
  const cantEmail = s.emailEligible != null && s.dailyLimit != null && s.emailEligible > s.dailyLimit ? s.emailEligible - s.dailyLimit : null;

  return (
    <AppShell crumb="Diagnose · Internal" active="diagnose">
      <SampleBanner>
        <label className="flex items-center gap-2 text-sm">Warmup state
          <select className="rounded-sm border border-sample bg-card px-2 py-1 text-foreground" value={state}
            onChange={(e) => { const next = e.currentTarget.value as EmailState; navigate(next); }}>
            {Object.entries(EMAIL_STATE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </SampleBanner>
      <Annotate>Mapping table: backend Status + consecutive evaluations → client label. "Active + no qualifying evaluation" = Getting started; "SteppedDown" = Limited.</Annotate>

      <h2 className="mt-6 text-base font-medium">Eligibility</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <ChannelTag>Text</ChannelTag>
          <p className="mt-2 text-muted-foreground">Eligible to invite today</p>
          <p className="mt-1 text-3xl font-medium tabular-nums">{s.textEligible.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">guests · current</p>
        </div>
        <div className="card-surface p-5">
          <ChannelTag>Email</ChannelTag>
          <p className="mt-2 flex items-center gap-1 text-muted-foreground">
            Eligible for email
            <Tooltip>
              <TooltipTrigger aria-label="Eligibility breakdown" className="text-muted-foreground hover:text-primary"><Info className="size-3.5" /></TooltipTrigger>
              <TooltipContent className="max-w-56">
                With email address {s.emailWithAddress.toLocaleString()} · not unsubscribed {s.emailUnsubscribed.toLocaleString()} · not suppressed {s.emailSuppressed.toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </p>
          {s.hasPlan ? (
            <>
              <p className="mt-1 text-3xl font-medium tabular-nums">{s.emailEligible?.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-muted-foreground">With email address · not unsubscribed · not suppressed</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Not applicable — no Email plan</p>
          )}
        </div>
        <div className="card-surface p-5">
          <ChannelTag>Email</ChannelTag>
          <p className="mt-2 text-muted-foreground">Email daily limit (today)</p>
          <p className="mt-1 text-3xl font-medium tabular-nums">{s.raw === "Paused" ? "0" : s.dailyLimit?.toLocaleString() ?? "—"}</p>
          {s.raw !== "Paused" && s.sentToday != null && remaining != null && (
            <p className="text-xs text-muted-foreground">{s.sentToday.toLocaleString()} sent · {remaining.toLocaleString()} left today</p>
          )}
          {cantEmail != null && cantEmail > 0 && (
            <p className="mt-2 text-xs font-medium text-warning">{cantEmail.toLocaleString()} eligible guests can't be emailed today</p>
          )}
        </div>
      </div>
      <Annotate>Eligible guests is an audience size; the daily limit is a per-day cap on emails sent. They measure different things — shown side by side so CSMs don't conflate them.</Annotate>

      <h2 className="mt-8 text-base font-medium">Email reputation & limits</h2>
      {state === "loading" ? (
        <div className="card-surface mt-3 space-y-3 p-6" aria-label="Loading diagnostics">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-4 animate-pulse rounded-sm bg-muted" style={{ width: `${90 - i * 12}%` }} />)}
        </div>
      ) : !s.hasPlan ? (
        <div className="card-surface mt-3 p-5">
          <p className="font-medium">{HOTEL_NAME} doesn't have Email plan {SUBSIDIARY_PLAN}</p>
          <p className="mt-1 text-muted-foreground">A warmup record isn't expected for hotels without the Email subscription. This is not a system failure.</p>
        </div>
      ) : s.raw == null ? (
        <div className="mt-3 flex gap-3 rounded-sm border border-warning bg-warning-soft p-5 text-warning" role="alert">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Warmup record missing</p>
            <p className="mt-1 text-foreground/80">The hotel has Email plan {SUBSIDIARY_PLAN} but no SubsidiaryEmailWarmupStates row. Status and limits are unknown — no default has been substituted. Flag for engineering (data initialization).</p>
          </div>
        </div>
      ) : (
        <div className="card-surface mt-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-sm bg-muted px-2.5 py-1 font-mono text-xs">Status: {s.raw}</span>
            <span className="rounded-sm bg-info-soft px-2.5 py-1 text-xs font-medium text-info">Hotel sees: {seen}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-start gap-4 rounded-sm border-l-4 border-l-primary bg-accent p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why this limit</p>
              <p className="mt-1 text-sm">{whyThisLimit(state, s)}</p>
            </div>
            <CopyExplanation state={state} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Group title="Limits">
              <p className="text-3xl font-medium tabular-nums">{s.dailyLimit?.toLocaleString()}<span className="ml-1 text-sm font-normal text-muted-foreground">/ day</span></p>
              <RampScale limit={s.dailyLimit ?? 0} />
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={s.sentToday ?? 0} aria-valuemax={s.dailyLimit ?? 1} aria-label="Emails sent today">
                <div className={`h-full ${barFill}`} style={{ width: `${s.dailyLimit ? Math.min(100, ((s.sentToday ?? 0) / s.dailyLimit) * 100) : 100}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.sentToday?.toLocaleString()} sent today · {remaining?.toLocaleString()} left</p>
              <div className="mt-4 border-t pt-3">
                <p className="flex items-center justify-between text-xs text-muted-foreground"><span>Monthly limit</span><span>{monthlyPct?.toFixed(0)}%</span></p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={s.monthlySent ?? 0} aria-valuemax={s.monthlyLimit} aria-label="Monthly email limit used">
                  <div className={`h-full ${monthlyPct === 100 ? "bg-warning" : "bg-primary"}`} style={{ width: `${monthlyPct ?? 0}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{s.monthlySent?.toLocaleString()} / {s.monthlyLimit.toLocaleString()} this month</p>
              </div>
            </Group>

            <Group title="Delivery signals · last evaluation">
              <div className="space-y-4">
                <Meter label="Bounce rate" value={s.bounce} max={0.15} verdict={bounceVerdict(s.bounce)} zones={[
                  { to: 0.05, cls: "bg-success/30" }, { to: 0.1, cls: "bg-warning/40" }, { to: 0.15, cls: "bg-danger/30" },
                ]} />
                <Meter label="Spam rate" value={s.spam} max={0.003} verdict={spamVerdict(s.spam)} zones={[
                  { to: 0.001, cls: "bg-success/30" }, { to: 0.003, cls: "bg-warning/40" },
                ]} />
                <Meter label="Unsubscribe rate" value={s.unsub} max={0.03} verdict={unsubVerdict(s.unsub)} zones={[
                  { to: 0.01, cls: "bg-success/30" }, { to: 0.03, cls: "bg-warning/40" },
                ]} />
              </div>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                Step-down: bounce 5–10%, spam &gt;0.10%, unsubscribe &gt;1%. Pause: bounce &gt;10% or a reputation bounce. An evaluation needs at least {WARMUP.minSendsForEval} sends in 24h.
              </p>
            </Group>

            <Group title="Evaluation history">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><History className="size-4" aria-hidden /> Consecutive healthy evaluations</span>
                <span className="font-mono text-lg font-medium tabular-nums">{s.consecutiveHealthy ?? "—"}</span>
              </div>
              {s.raw === "Paused" && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Pause lifts after 2 consecutive healthy evaluations</p>
                  <div className="mt-1.5 flex gap-1.5">
                    {[1, 2].map((i) => (
                      <span key={i} className={`size-3.5 rounded-full ${i <= (s.consecutiveHealthy ?? 0) ? "bg-success" : "bg-muted ring-1 ring-border"}`} aria-label={`Healthy evaluation ${i} ${i <= (s.consecutiveHealthy ?? 0) ? "reached" : "not yet"}`} />
                    ))}
                  </div>
                </div>
              )}
              <ul className="mt-4 space-y-2 border-t pt-3 text-sm">
                <li className="flex justify-between gap-4"><span className="text-muted-foreground">Last evaluated</span><span className="font-mono text-xs tabular-nums">{fmtDate(s.lastEvaluatedOn)}</span></li>
                <li className="flex justify-between gap-4"><span className="text-muted-foreground">Last step-down</span><span className="font-mono text-xs tabular-nums">{fmtDate(s.lastStepDownOn)}</span></li>
                <li className="flex justify-between gap-4"><span className="text-muted-foreground">Paused on</span><span className="font-mono text-xs tabular-nums">{fmtDate(s.pausedOn)}</span></li>
              </ul>
            </Group>
          </div>

          <p className="mt-6 border-t pt-3 text-xs text-muted-foreground">
            Source: SubsidiaryEmailWarmupStates · Subsidiary {SUBSIDIARY_ID} · Plan {SUBSIDIARY_PLAN} ·{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">{ADO_TICKET} (internal)</a>
          </p>
        </div>
      )}
    </AppShell>
  );
}
