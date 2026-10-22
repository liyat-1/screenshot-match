import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2, AlertTriangle, PauseCircle, Sparkles, HelpCircle, Info, X, Mail,
  TrendingUp, TrendingDown, Clock3, UserCheck, ListChecks, MousePointerClick, CalendarClock,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-sm px-3 text-xs font-medium ring-1 ring-inset ring-current/15 ${TONES[tone]}`}>
      <Icon className="size-3.5" aria-hidden /> {label}
    </span>
  );
}

function ChangeChip({ previous, current }: { previous: number; current: number }) {
  if (current > previous) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-current/15 ${TONES.success}`}>
        ↑ +{(current - previous).toLocaleString()} since yesterday
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-current/15 ${TONES.warning}`}>
      ↓ Reduced from {previous.toLocaleString()}
    </span>
  );
}

function UsageBar({ sent, limit }: { sent: number; limit: number }) {
  const tone = usageTone(sent, limit);
  const fill = tone === "grey" ? "bg-muted-foreground/40" : tone === "amber" ? "bg-warning" : "bg-primary";
  const pct = limit > 0 ? Math.min(100, (sent / limit) * 100) : 100;
  return (
    <div className="h-2 overflow-hidden rounded-sm bg-muted" role="progressbar" aria-valuenow={sent} aria-valuemax={limit} aria-label="Emails sent today">
      <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function InfoTrigger({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={label} className="size-6 shrink-0 text-muted-foreground hover:text-primary">
            <Info aria-hidden />
          </Button>
        </PopoverTrigger>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function HealthInfoPopover() {
  return (
    <Popover>
      <InfoTrigger label="About email sending health" />
      <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-card text-card-foreground" align="end">
        <HowHealthWorks />
      </PopoverContent>
    </Popover>
  );
}

export function LimitInfoPopover() {
  return (
    <Popover>
      <InfoTrigger label="About your daily email limit" />
      <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-card text-sm text-card-foreground" align="end">
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
    <div className="flex items-center gap-3 rounded-sm border border-danger/30 bg-danger-soft px-4 py-3 text-danger" role="alert">
      <PauseCircle className="size-5 shrink-0" aria-hidden />
      <p className="text-sm">
        Email sending is paused for {HOTEL_NAME}. Text messages are not affected.{" "}
        <a href="#sending-health" className="font-medium underline">View details</a>
      </p>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss banner" className="ml-auto rounded-sm p-1 transition-colors hover:bg-danger/10">
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

const TEXT_TIPS = [
  { icon: UserCheck, title: "Text guests who opted in.", body: "Guests who expect your messages rarely reply STOP." },
  { icon: ListChecks, title: "Keep phone numbers accurate.", body: "Wrong or landline numbers can't receive texts." },
  { icon: MousePointerClick, title: "Keep messages short and clear.", body: "Avoid all caps, lots of links or spam-like wording." },
  { icon: CalendarClock, title: "Send at sensible hours.", body: "Messages late at night lead to more opt-outs." },
];

export function TipsPanel({ open, onClose, channel = "email" }: { open: boolean; onClose: () => void; channel?: "email" | "text" }) {
  const tips = channel === "text" ? TEXT_TIPS : TIPS;
  const title = channel === "text" ? "Tips for better text delivery" : "Tips for better email delivery";
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <aside className="absolute right-0 top-0 flex h-full w-[min(400px,90vw)] flex-col bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-medium">{title}</h2>
          <button onClick={onClose} aria-label="Close tips panel" className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <ul className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {tips.map((t) => (
            <li key={t.title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-info-soft text-info"><t.icon className="size-4.5" aria-hidden /></span>
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="mt-0.5 text-muted-foreground">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t px-6 py-4">
          <button className="w-full rounded-sm border border-input px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
            Need help? Contact your account manager
          </button>
        </div>
      </aside>
    </div>
  );
}

/** On-demand explanation, shared by the health card's help link. */
function HowHealthWorks() {
  return (
    <div>
      <h3 className="text-sm font-medium">How email health works</h3>
      <ul className="mt-3 space-y-2.5 text-sm">
        <li className="flex items-center gap-2.5"><Sparkles className="size-4 shrink-0 text-info" aria-hidden /> Getting started — waiting for your first delivery check.</li>
        <li className="flex items-center gap-2.5"><CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden /> Healthy — your emails are being delivered well.</li>
        <li className="flex items-center gap-2.5"><AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden /> Limited — bounces or spam reports lowered your limit.</li>
        <li className="flex items-center gap-2.5"><PauseCircle className="size-4 shrink-0 text-danger" aria-hidden /> Paused — sending stops until delivery recovers.</li>
        <li className="flex items-center gap-2.5"><Clock3 className="size-4 shrink-0 text-muted-foreground" aria-hidden /> Too few sends — your last health result and limit stay unchanged until a new delivery check.</li>
      </ul>
      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
        We check delivery every day, once you've sent at least 50 emails in a day.
      </p>
    </div>
  );
}

/** On-demand explanation, shared by the daily limit card's help link. */
function HowLimitWorks({ onOpenTips }: { onOpenTips: () => void }) {
  return (
    <div>
      <h3 className="text-sm font-medium">How your limit works</h3>
      <p className="mt-2 text-sm text-muted-foreground">Your daily limit protects your sending reputation and helps keep emails out of spam folders.</p>
      <ul className="mt-3 space-y-2.5 text-sm">
        <li className="flex items-center gap-2.5"><TrendingUp className="size-4 shrink-0 text-success" aria-hidden /> Grows as your emails are delivered well.</li>
        <li className="flex items-center gap-2.5"><TrendingDown className="size-4 shrink-0 text-warning" aria-hidden /> Shrinks if emails bounce or are marked as spam.</li>
        <li className="flex items-center gap-2.5"><Clock3 className="size-4 shrink-0 text-muted-foreground" aria-hidden /> Resets daily at midnight ({HOTEL_TZ}).</li>
      </ul>
      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Your monthly plan allowance also applies. If it is reached, sending resumes when the next month begins, even if you have emails left in your daily limit.</p>
      <Button onClick={onOpenTips} variant="link" className="mt-2 h-auto whitespace-normal p-0 text-left">Tips for better delivery →</Button>
    </div>
  );
}

function CardSkeleton({ label }: { label: string }) {
  return (
    <section className="card-surface p-6" aria-label={label}>
      <div className="flex items-center justify-between gap-3">
        <div className="h-5 w-44 animate-pulse rounded-sm bg-muted" />
        {label.startsWith("Daily") ? <LimitInfoPopover /> : <HealthInfoPopover />}
      </div>
      <div className="mt-5">
        <div className="space-y-3">
          <div className="h-7 w-28 animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-sm bg-muted" />
        </div>
      </div>
    </section>
  );
}

/** Compact health status with its explanation available on demand. */
export function EmailHealthCard({ state, scenario, onOpenTips }: { state: EmailState; scenario: EmailScenario; onOpenTips: () => void }) {
  if (state === "loading") return <CardSkeleton label="Email sending health loading" />;

  const pill = pillFor(state, scenario);
  const copy = clientCopy(state);
  const paused = scenario.raw === "Paused";
  const limited = scenario.raw === "SteppedDown";
  const unavailable = state === "unavailable";
  const accent = paused ? "border-l-4 border-l-danger" : limited ? "border-l-4 border-l-warning" : "";

  return (
    <section id="sending-health" className={`card-surface min-w-0 scroll-mt-6 p-5 ${accent}`} aria-labelledby="health-h">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="health-h" className="text-base font-medium">Email sending health</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Today · {HOTEL_TZ}</span>
          <HealthInfoPopover />
        </div>
      </div>
      <div className="mt-4 text-sm">
        {unavailable ? (
          <div className="flex flex-col items-start gap-3 rounded-sm border border-dashed border-input p-5">
            <span className="grid size-10 place-items-center rounded-sm bg-muted text-muted-foreground"><HelpCircle className="size-5" aria-hidden /></span>
            <div>
              <p className="font-medium">{copy.headline}</p>
              <p className="mt-1 text-sm text-muted-foreground">This is usually temporary. Your emails and limits are not affected.</p>
            </div>
            <button className="rounded-sm border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">Try again</button>
          </div>
        ) : (
          <div>
            <StatusPill tone={pill.tone} icon={pill.icon} label={pill.label} />
            {state === "too_few_sends" && <span className="ml-2 inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" aria-hidden />Too few sends</span>}
            <p className="mt-3 font-medium">{copy.headline}</p>
            {copy.support && <p className="mt-1 text-muted-foreground">{copy.support}</p>}
            {limited && (
              <button onClick={onOpenTips} className="mt-3 rounded-sm border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
                See how to improve delivery
              </button>
            )}
            {paused && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                  Contact your account manager
                </button>
                <button onClick={onOpenTips} className="text-sm text-primary hover:underline">See how to improve delivery</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 border-t pt-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="link" className="h-auto whitespace-normal p-0 text-left"><HelpCircle aria-hidden />How email health works</Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-card text-card-foreground">
            <HowHealthWorks />
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}

/** Compact daily and monthly usage with an on-demand explanation. */
export function DailyLimitCard({ state, scenario, onOpenTips }: { state: EmailState; scenario: EmailScenario; onOpenTips: () => void }) {
  if (state === "loading") return <CardSkeleton label="Daily email limit loading" />;

  const paused = scenario.raw === "Paused";
  const unavailable = state === "unavailable";
  const monthlyCap = state === "monthly_cap";
  const limitReached = state === "limit_reached";
  const remaining = scenario.dailyLimit != null && scenario.sentToday != null ? remainingToday(scenario.dailyLimit, scenario.sentToday, scenario.raw) : null;
  const monthlyPct = scenario.monthlySent != null ? Math.min(100, (scenario.monthlySent / scenario.monthlyLimit) * 100) : null;

  return (
    <section className="card-surface min-w-0 p-5" aria-labelledby="limit-h">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="limit-h" className="text-base font-medium">Daily email limit</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Today · {HOTEL_TZ}</span>
          <LimitInfoPopover />
        </div>
      </div>
      <div className="mt-4">
        {unavailable ? (
          <div className="flex flex-col items-start gap-3 rounded-sm border border-dashed border-input p-5">
            <span className="grid size-10 place-items-center rounded-sm bg-muted text-muted-foreground"><Mail className="size-5" aria-hidden /></span>
            <div>
              <p className="font-medium">Daily limit unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">We couldn't load your sending limit. Check back in a moment.</p>
            </div>
            <button className="rounded-sm border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">Try again</button>
          </div>
        ) : (
          <div>
            {paused ? (
              <p className="text-4xl font-medium text-muted-foreground">0 emails today</p>
            ) : scenario.dailyLimit == null ? (
              <p className="text-4xl font-medium text-muted-foreground">—</p>
            ) : (
              <>
                <p>
                  <span className="text-4xl font-medium tracking-tight tabular-nums">{scenario.dailyLimit.toLocaleString()}</span>{" "}
                  <span className="text-muted-foreground">/ day</span>
                </p>
                <div className="mt-4">
                  <UsageBar sent={scenario.sentToday ?? 0} limit={scenario.dailyLimit} />
                  <div className="mt-2 flex justify-between text-sm">
                    <span><strong>{remaining?.toLocaleString()}</strong> left today</span>
                    <span className="text-muted-foreground">{scenario.sentToday?.toLocaleString()} sent</span>
                  </div>
                </div>
                {scenario.previousDailyLimit != null && scenario.previousDailyLimit !== scenario.dailyLimit && !monthlyCap && (
                  <div className="mt-2"><ChangeChip previous={scenario.previousDailyLimit} current={scenario.dailyLimit} /></div>
                )}
                {limitReached && (
                  <p className="mt-3 flex items-center gap-2 rounded-sm bg-info-soft px-3 py-2 text-sm text-info">
                    <Clock3 className="size-4 shrink-0" aria-hidden />
                    Today's limit reached. Remaining emails will send after midnight ({HOTEL_TZ}).
                  </p>
                )}
              </>
            )}
            {scenario.monthlySent != null && (
              <div className="mt-5 border-t pt-4">
                <p className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">This month</span>
                  <span className="tabular-nums">{scenario.monthlySent.toLocaleString()} / {scenario.monthlyLimit.toLocaleString()}</span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-muted" role="progressbar" aria-valuenow={scenario.monthlySent} aria-valuemax={scenario.monthlyLimit} aria-label="Monthly email limit used">
                  <div className={`h-full ${monthlyCap ? "bg-warning" : "bg-primary"}`} style={{ width: `${monthlyPct ?? 0}%` }} />
                </div>
                {monthlyCap && (
                  <p className="mt-3 flex items-center gap-2 rounded-sm bg-warning-soft px-3 py-2 text-sm text-warning">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden />
                    Monthly limit reached — sending resumes on November 1.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 border-t pt-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="link" className="h-auto whitespace-normal p-0 text-left"><HelpCircle aria-hidden />How your limit works</Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-card text-card-foreground">
            <HowLimitWorks onOpenTips={onOpenTips} />
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}

export function NoEmailPlan({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`card-surface flex flex-col ${compact ? "p-6" : "items-center px-6 py-16 text-center"}`}>
      <span className="grid size-11 place-items-center rounded-sm bg-info-soft text-info"><Mail className="size-5" aria-hidden /></span>
      <h2 className="mt-4 text-base font-medium">No Email plan</h2>
      <p className={`mt-1 text-muted-foreground ${compact ? "text-sm" : "max-w-md"}`}>
        Your account doesn't include Email outreach, so there's no email activity or sending limit to show.
        To add Email to your plan, reach out to your Customer Success Manager.
      </p>
      <div className={`mt-4 flex flex-wrap gap-3 ${compact ? "" : "justify-center"}`}>
        <button className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          Contact your Customer Success Manager
        </button>
        <button className="rounded-sm border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
          Learn about Email outreach
        </button>
      </div>
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
        <HealthInfoPopover />
      </div>
      <div className="mt-3"><StatusPill tone={pill.tone} icon={pill.icon} label={pill.label} /></div>
      <p className="mt-3 text-sm font-medium">{copy.headline}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {paused ? "Daily limit 0 · sending paused" : scenario.dailyLimit != null ? `Daily limit ${scenario.dailyLimit.toLocaleString()} · ${remaining?.toLocaleString()} left today` : "Daily limit unavailable"}
      </p>
      <Link to="/" search={{ ...search, channel: "email" } as never} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        View email details →
      </Link>
    </section>
  );
}
