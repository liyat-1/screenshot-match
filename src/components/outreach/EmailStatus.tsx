import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2, AlertTriangle, PauseCircle, Sparkles, HelpCircle, Info, X,
  TrendingUp, TrendingDown, Clock3, UserCheck, ListChecks, MousePointerClick, CalendarClock,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  clientCopy, clientLabel, remainingToday, usageTone, HOTEL_TZ, HOTEL_NAME,
  type Channel, type EmailScenario, type EmailState,
} from "@/lib/outreach-data";

const TONES = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
} as const;

type Tone = keyof typeof TONES;

function pillFor(state: EmailState, scenario: EmailScenario): { tone: Tone; icon: typeof Info; label: string } {
  const label = clientLabel(scenario.raw, scenario.evaluated);
  if (state === "unavailable" || state === "loading") return { tone: "neutral", icon: HelpCircle, label: "Unavailable" };
  if (label === "Paused") return { tone: "danger", icon: PauseCircle, label: "Paused" };
  if (label === "Limited") return { tone: "warning", icon: AlertTriangle, label: "Limited" };
  if (label === "Getting started") return { tone: "info", icon: Sparkles, label: "Getting started" };
  return { tone: "success", icon: CheckCircle2, label: "Healthy" };
}

export function StatusPill({ tone, icon: Icon, label }: { tone: Tone; icon: typeof Info; label: string }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium ring-1 ring-inset ring-current/15 ${TONES[tone]}`}>
      <Icon className="size-3.5" aria-hidden /> {label}
    </span>
  );
}

function ChangeChip({ previous, current }: { previous: number; current: number }) {
  if (current > previous) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-current/15 ${TONES.success}`}>
        ↑ +{(current - previous).toLocaleString()} since yesterday
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-current/15 ${TONES.warning}`}>
      ↓ Reduced from {previous.toLocaleString()}
    </span>
  );
}

function UsageBar({ sent, limit }: { sent: number; limit: number }) {
  const tone = usageTone(sent, limit);
  const fill = tone === "grey" ? "bg-muted-foreground/40" : tone === "amber" ? "bg-warning" : "bg-primary";
  const pct = limit > 0 ? Math.min(100, (sent / limit) * 100) : 100;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={sent} aria-valuemax={limit} aria-label="Emails sent today">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LimitInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger
        className="rounded-full text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="About your daily email limit"
      >
        <Info className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="end">
        <p className="font-medium">About your daily email limit</p>
        <p className="mt-2">To keep your emails out of spam folders, we control how many you can send each day.</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>When your emails are delivered well, your limit grows step by step.</li>
          <li>If emails bounce or are marked as spam, we lower it to protect your reputation.</li>
          <li>If too many emails can't be delivered, we pause sending until things recover.</li>
        </ul>
        <p className="mt-2">Your limit resets every day at midnight, hotel time.</p>
      </PopoverContent>
    </Popover>
  );
}

export function PausedBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-center gap-3 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-danger" role="alert">
      <PauseCircle className="size-5 shrink-0" aria-hidden />
      <p className="text-sm">
        Email sending is paused for {HOTEL_NAME}. Text messages are not affected.{" "}
        <a href="#sending-health" className="font-medium underline">View details</a>
      </p>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss banner" className="ml-auto rounded-md p-1 transition-colors hover:bg-danger/10">
        <X className="size-4" />
      </button>
    </div>
  );
}

const TIPS = [
  { icon: UserCheck, title: "Email guests who expect to hear from you.", body: "Recent stays and bookings perform best." },
  { icon: ListChecks, title: "Keep guest emails accurate.", body: "Typos and old addresses cause bounces." },
  { icon: MousePointerClick, title: "Make unsubscribing easy.", body: "It's better than being marked as spam." },
  { icon: TrendingUp, title: "Send relevant content.", body: "Targeted segments get fewer complaints than “send to all”." },
  { icon: CalendarClock, title: "Avoid sudden spikes.", body: "Spreading campaigns over days protects your limit." },
];

export function TipsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Tips for better email delivery">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <aside className="absolute right-0 top-0 flex h-full w-[min(400px,90vw)] flex-col bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-medium">Tips for better email delivery</h2>
          <button onClick={onClose} aria-label="Close tips panel" className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <ul className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {TIPS.map((t) => (
            <li key={t.title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-info-soft text-info"><t.icon className="size-4.5" aria-hidden /></span>
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="mt-0.5 text-muted-foreground">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t px-6 py-4">
          <button className="w-full rounded-md border border-input px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
            Need help? Contact your account manager
          </button>
        </div>
      </aside>
    </div>
  );
}

export function SendingHealthCard({ state, scenario, onOpenTips }: { state: EmailState; scenario: EmailScenario; onOpenTips: () => void }) {
  if (state === "loading") {
    return (
      <section className="card-surface p-6" aria-label="Email sending health loading">
        <div className="h-5 w-44 animate-pulse rounded-sm bg-muted" />
        <div className="mt-6 grid gap-8 md:grid-cols-[3fr_4fr_3fr]">
          <div className="space-y-3"><div className="h-7 w-28 animate-pulse rounded-sm bg-muted" /><div className="h-4 w-full animate-pulse rounded-sm bg-muted" /><div className="h-4 w-3/4 animate-pulse rounded-sm bg-muted" /></div>
          <div className="space-y-3"><div className="h-10 w-32 animate-pulse rounded-sm bg-muted" /><div className="h-2 w-full animate-pulse rounded-full bg-muted" /></div>
          <div className="space-y-3"><div className="h-4 w-full animate-pulse rounded-sm bg-muted" /><div className="h-4 w-full animate-pulse rounded-sm bg-muted" /><div className="h-4 w-2/3 animate-pulse rounded-sm bg-muted" /></div>
        </div>
      </section>
    );
  }

  const pill = pillFor(state, scenario);
  const copy = clientCopy(state);
  const paused = scenario.raw === "Paused";
  const limited = scenario.raw === "SteppedDown";
  const unavailable = state === "unavailable";
  const monthlyCap = state === "monthly_cap";
  const limitReached = state === "limit_reached";
  const remaining = scenario.dailyLimit != null && scenario.sentToday != null ? remainingToday(scenario.dailyLimit, scenario.sentToday, scenario.raw) : null;
  const accent = paused ? "border-l-4 border-l-danger" : limited ? "border-l-4 border-l-warning" : "";

  return (
    <section id="sending-health" className={`card-surface scroll-mt-6 p-6 ${accent}`} aria-labelledby="health-h">
      <div className="flex items-center gap-3">
        <h2 id="health-h" className="text-base font-medium">Email sending health</h2>
        <span className="text-xs text-muted-foreground">Today · {HOTEL_TZ}</span>
        <span className="ml-auto"><LimitInfoPopover /></span>
      </div>
      <div className="mt-5 grid gap-8 md:grid-cols-[3fr_4fr_3fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={pill.tone} icon={pill.icon} label={pill.label} />
            {monthlyCap && <StatusPill tone="neutral" icon={Info} label="Monthly limit reached" />}
          </div>
          <p className="mt-3 font-medium">{copy.headline}</p>
          {copy.support && <p className="mt-1 text-muted-foreground">{copy.support}</p>}
          {limited && (
            <button onClick={onOpenTips} className="mt-3 rounded-md border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
              See how to improve delivery
            </button>
          )}
          {paused && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                Contact your account manager
              </button>
              <button onClick={onOpenTips} className="text-sm text-primary hover:underline">See how to improve delivery</button>
            </div>
          )}
          {unavailable && <button className="mt-3 text-sm text-primary hover:underline">Try again</button>}
        </div>

        <div>
          <p className="text-muted-foreground">Daily email limit</p>
          {paused ? (
            <p className="mt-2 text-4xl font-medium text-muted-foreground">0 emails today</p>
          ) : scenario.dailyLimit == null ? (
            <p className="mt-2 text-4xl font-medium text-muted-foreground">—</p>
          ) : (
            <>
              <p className="mt-2">
                <span className="text-4xl font-medium tracking-tight tabular-nums">{scenario.dailyLimit.toLocaleString()}</span>{" "}
                <span className="text-muted-foreground">/ day</span>
              </p>
              <div className="mt-4">
                <UsageBar sent={scenario.sentToday ?? 0} limit={monthlyCap ? scenario.dailyLimit : scenario.dailyLimit} />
                <div className="mt-2 flex justify-between text-sm">
                  <span><strong>{remaining?.toLocaleString()}</strong> left today</span>
                  <span className="text-muted-foreground">{scenario.sentToday?.toLocaleString()} sent</span>
                </div>
              </div>
              {scenario.previousDailyLimit != null && scenario.previousDailyLimit !== scenario.dailyLimit && !monthlyCap && (
                <div className="mt-2"><ChangeChip previous={scenario.previousDailyLimit} current={scenario.dailyLimit} /></div>
              )}
              {limitReached && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Today's limit reached. Remaining emails will send after midnight ({HOTEL_TZ}).
                </p>
              )}
            </>
          )}
        </div>

        <div className="rounded-lg bg-muted/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">How your limit works</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5"><TrendingUp className="size-4 shrink-0 text-success" aria-hidden /> Grows as your emails are delivered well.</li>
            <li className="flex items-center gap-2.5"><TrendingDown className="size-4 shrink-0 text-warning" aria-hidden /> Shrinks if emails bounce or are marked as spam.</li>
            <li className="flex items-center gap-2.5"><Clock3 className="size-4 shrink-0 text-muted-foreground" aria-hidden /> Resets daily at midnight ({HOTEL_TZ}).</li>
          </ul>
          <button onClick={onOpenTips} className="mt-3 text-sm font-medium text-primary hover:underline">Tips for better delivery →</button>
        </div>
      </div>
    </section>
  );
}

export function NoEmailPlan() {
  return (
    <section className="card-surface flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-info-soft text-info"><HelpCircle className="size-5" aria-hidden /></span>
      <h2 className="mt-4 text-base font-medium">Email outreach isn't available on your plan</h2>
      <p className="mt-1 max-w-md text-muted-foreground">Your account doesn't include Email outreach, so there's no email activity or sending limit to show. Contact your Customer Success Manager to learn more.</p>
    </section>
  );
}

export function CompactHealthCard({ state, scenario, search }: { state: EmailState; scenario: EmailScenario; search: { channel: Channel; range: number; state: EmailState; remaining: boolean } }) {
  const pill = pillFor(state, scenario);
  const copy = clientCopy(state);
  const paused = scenario.raw === "Paused";
  const limited = scenario.raw === "SteppedDown";
  const remaining = scenario.dailyLimit != null && scenario.sentToday != null ? remainingToday(scenario.dailyLimit, scenario.sentToday, scenario.raw) : null;
  const accent = paused ? "border-l-4 border-l-danger" : limited ? "border-l-4 border-l-warning" : "";
  return (
    <section className={`card-surface p-6 ${accent}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-medium">Email sending health</h2>
        <StatusPill tone={pill.tone} icon={pill.icon} label={pill.label} />
      </div>
      <p className="mt-3 text-sm font-medium">{copy.headline}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {paused ? "Daily limit 0 · sending paused" : scenario.dailyLimit != null ? `Daily limit ${scenario.dailyLimit.toLocaleString()} · ${remaining?.toLocaleString()} left today` : "Daily limit unavailable"}
      </p>
      <Link to="/" search={{ ...search, channel: "email" }} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        View email details →
      </Link>
    </section>
  );
}
