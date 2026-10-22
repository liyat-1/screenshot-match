import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Ban, CheckCircle2, HelpCircle, Info, MessageSquareOff, PhoneOff, ShieldAlert, Sparkles, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusPill } from "@/components/outreach/EmailStatus";
import { HOTEL_NAME } from "@/lib/outreach-data";
import { TEXT_TBD, deliveryRate, textCopy, textLabel, type TextScenario, type TextState } from "@/lib/text-data";

type PillTone = "success" | "warning" | "danger" | "info" | "neutral";

export function textPill(state: TextState): { tone: PillTone; icon: typeof Info; label: string } {
  const l = textLabel(state);
  if (l === "Healthy") return { tone: "success", icon: CheckCircle2, label: l };
  if (l === "Needs attention") return { tone: "warning", icon: AlertTriangle, label: l };
  if (l === "Blocked") return { tone: "danger", icon: Ban, label: l };
  if (l === "Getting started") return { tone: "info", icon: Sparkles, label: l };
  return { tone: "neutral", icon: HelpCircle, label: "Unavailable" };
}

export function textAccent(state: TextState) {
  const l = textLabel(state);
  return l === "Blocked" ? "border-l-4 border-l-danger" : l === "Needs attention" ? "border-l-4 border-l-warning" : "";
}

function InfoIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={label} className="size-6 shrink-0 text-muted-foreground hover:text-primary"><Info aria-hidden /></Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-card text-sm text-card-foreground" align="end">{children}</PopoverContent>
    </Popover>
  );
}

function HowTextHealthWorks() {
  return (
    <div>
      <h3 className="text-sm font-medium">How text health works</h3>
      <ul className="mt-3 space-y-2.5 text-sm">
        <li className="flex items-center gap-2.5"><Sparkles className="size-4 shrink-0 text-info" aria-hidden /> Getting started — not enough texts sent yet.</li>
        <li className="flex items-center gap-2.5"><CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden /> Healthy — texts are being delivered well.</li>
        <li className="flex items-center gap-2.5"><AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden /> Needs attention — failed texts or opt-outs are rising.</li>
        <li className="flex items-center gap-2.5"><Ban className="size-4 shrink-0 text-danger" aria-hidden /> Blocked — your sending number can't send right now.</li>
      </ul>
      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Based on the last {TEXT_TBD.windowDays} days of texts. Texts have no daily limit.</p>
    </div>
  );
}

function HowTextDeliveryWorks({ onOpenTips }: { onOpenTips: () => void }) {
  return (
    <div>
      <h3 className="text-sm font-medium">How text delivery works</h3>
      <ul className="mt-3 space-y-2.5 text-sm">
        <li className="flex items-center gap-2.5"><MessageSquareOff className="size-4 shrink-0 text-muted-foreground" aria-hidden /> Guests can reply STOP at any time. We never text them again.</li>
        <li className="flex items-center gap-2.5"><ShieldAlert className="size-4 shrink-0 text-warning" aria-hidden /> Mobile carriers may block messages that look like spam.</li>
        <li className="flex items-center gap-2.5"><PhoneOff className="size-4 shrink-0 text-muted-foreground" aria-hidden /> Wrong or landline numbers can't receive texts.</li>
      </ul>
      <Button onClick={onOpenTips} variant="link" className="mt-3 h-auto whitespace-normal p-0 text-left">Tips for better text delivery →</Button>
    </div>
  );
}

function Skeleton({ label }: { label: string }) {
  return (
    <section className="card-surface space-y-3 p-5" aria-label={label}>
      <div className="h-5 w-44 animate-pulse rounded-sm bg-muted" />
      <div className="h-7 w-28 animate-pulse rounded-sm bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded-sm bg-muted" />
    </section>
  );
}

export function TextHealthCard({ state, onOpenTips }: { state: TextState; onOpenTips: () => void }) {
  if (state === "loading") return <Skeleton label="Text sending health loading" />;
  const pill = textPill(state);
  const copy = textCopy(state);
  const needs = textLabel(state) === "Needs attention";
  return (
    <section id="text-health" className={`card-surface min-w-0 scroll-mt-6 p-5 ${textAccent(state)}`} aria-labelledby="text-health-h">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="text-health-h" className="text-base font-medium">Text sending health</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Last {TEXT_TBD.windowDays} days</span>
          <InfoIcon label="About text sending health"><HowTextHealthWorks /></InfoIcon>
        </div>
      </div>
      <div className="mt-4 text-sm">
        {state === "unavailable" ? (
          <div className="flex flex-col items-start gap-3 rounded-sm border border-dashed border-input p-5">
            <span className="grid size-10 place-items-center rounded-sm bg-muted text-muted-foreground"><HelpCircle className="size-5" aria-hidden /></span>
            <p className="font-medium">{copy.headline}</p>
            <button className="rounded-sm border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">Try again</button>
          </div>
        ) : (
          <div>
            <StatusPill tone={pill.tone} icon={pill.icon} label={pill.label} />
            <p className="mt-3 font-medium">{copy.headline}</p>
            {copy.support && <p className="mt-1 text-muted-foreground">{copy.support}</p>}
            {needs && (
              <button onClick={onOpenTips} className="mt-3 rounded-sm border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">See how to improve delivery</button>
            )}
            {state === "blocked" && (
              <button className="mt-3 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">Contact your account manager</button>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 border-t pt-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="link" className="h-auto whitespace-normal p-0 text-left"><HelpCircle aria-hidden />How text health works</Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-card text-card-foreground"><HowTextHealthWorks /></PopoverContent>
        </Popover>
      </div>
    </section>
  );
}

export function TextDeliveryCard({ state, scenario, onOpenTips }: { state: TextState; scenario: TextScenario; onOpenTips: () => void }) {
  if (state === "loading") return <Skeleton label="Messages delivered loading" />;
  const rate = deliveryRate(scenario);
  const ok = rate != null && rate >= TEXT_TBD.deliveryRate;
  const empty = state === "unavailable";
  return (
    <section className="card-surface min-w-0 p-5" aria-labelledby="text-delivery-h">
      <div className="flex items-center justify-between gap-3">
        <h2 id="text-delivery-h" className="text-base font-medium">Messages delivered</h2>
        <InfoIcon label="About messages delivered">
          <p className="font-medium">About messages delivered</p>
          <p className="mt-2">How many of the texts you sent in the last {TEXT_TBD.windowDays} days reached guests' phones. Texts have no daily limit.</p>
        </InfoIcon>
      </div>
      {empty || scenario.sent == null ? (
        <p className="mt-4 text-sm text-muted-foreground">Delivery details are unavailable right now.</p>
      ) : (
        <div className="mt-4 text-sm">
          <p><span className="text-4xl font-medium tracking-tight tabular-nums">{(scenario.delivered ?? 0).toLocaleString()}</span> <span className="text-muted-foreground">of {scenario.sent.toLocaleString()} sent</span></p>
          <div className="mt-3 h-2 overflow-hidden rounded-sm bg-muted" role="progressbar" aria-label="Texts delivered" aria-valuenow={scenario.delivered ?? 0} aria-valuemax={scenario.sent}>
            <div className={`h-full ${scenario.sent === 0 ? "" : ok ? "bg-success" : "bg-warning"}`} style={{ width: `${scenario.sent ? ((scenario.delivered ?? 0) / scenario.sent) * 100 : 0}%` }} />
          </div>
          <p className="mt-2 text-muted-foreground">{(scenario.optOuts ?? 0).toLocaleString()} guests opted out</p>
        </div>
      )}
      <div className="mt-4 border-t pt-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="link" className="h-auto whitespace-normal p-0 text-left"><HelpCircle aria-hidden />How text delivery works</Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-sm bg-card text-card-foreground"><HowTextDeliveryWorks onOpenTips={onOpenTips} /></PopoverContent>
        </Popover>
      </div>
    </section>
  );
}

export function TextBlockedBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-center gap-3 rounded-sm border border-danger/30 bg-danger-soft px-4 py-3 text-danger" role="alert">
      <Ban className="size-5 shrink-0" aria-hidden />
      <p className="text-sm">Text sending is blocked for {HOTEL_NAME}. Email is not affected. <a href="#text-health" className="font-medium underline">View details</a></p>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss banner" className="ml-auto rounded-sm p-1 transition-colors hover:bg-danger/10"><X className="size-4" /></button>
    </div>
  );
}

export function CompactTextHealthCard<S extends Record<string, unknown>>({ state, scenario, search }: { state: TextState; scenario: TextScenario; search: S }) {
  const pill = textPill(state);
  const copy = textCopy(state);
  return (
    <section className={`card-surface p-6 ${textAccent(state)}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-medium">Text sending health</h2>
        <InfoIcon label="About text sending health"><HowTextHealthWorks /></InfoIcon>
      </div>
      <div className="mt-3"><StatusPill tone={pill.tone} icon={pill.icon} label={pill.label} /></div>
      <p className="mt-3 text-sm font-medium">{copy.headline}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {scenario.sent != null ? `${(scenario.delivered ?? 0).toLocaleString()} of ${scenario.sent.toLocaleString()} delivered · last ${TEXT_TBD.windowDays} days` : "Delivery details unavailable"}
      </p>
      <Link to="/" search={{ ...search, channel: "text" } as never} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">View text details →</Link>
    </section>
  );
}
