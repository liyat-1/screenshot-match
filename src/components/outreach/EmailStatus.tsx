import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, PauseCircle, Hourglass, HelpCircle, Info, Ban } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { clientLabel, remainingToday, type EmailScenario } from "@/lib/outreach-data";

const TONES = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
} as const;

function reputationCopy(s: EmailScenario) {
  if (!s.raw) return { tone: "info" as const, icon: HelpCircle, label: "Unavailable", heading: "Email reputation is unavailable", body: "We can't display your current email delivery status right now." };
  if (s.raw === "Paused") return { tone: "danger" as const, icon: PauseCircle, label: "Paused", heading: "Email sending is temporarily paused", body: "Email delivery needs to recover before sending can resume. This happens automatically once delivery is healthy again." };
  if (s.tooFewSends) return { tone: "info" as const, icon: Hourglass, label: "Assessing", heading: "We're still assessing email delivery", body: "There hasn't been enough email activity to assess delivery health yet. Your current sending limit still applies." };
  if (s.raw === "SteppedDown") return { tone: "warning" as const, icon: AlertTriangle, label: clientLabel(s.raw)!, heading: "Your sending limit has been reduced", body: "Some delivery signals need attention. Your current limit has been reduced to help protect email delivery." };
  return { tone: "success" as const, icon: CheckCircle2, label: "Healthy", heading: "Your email delivery is healthy", body: "Your sending limit can increase as delivery remains healthy." };
}

export function ReputationCard({ scenario }: { scenario: EmailScenario }) {
  const c = reputationCopy(scenario);
  return (
    <section className="card-surface p-5" aria-labelledby="rep-h">
      <h2 id="rep-h" className="text-base font-medium">Email reputation</h2>
      <div className="mt-4 flex gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${TONES[c.tone]}`}><c.icon className="size-5" aria-hidden /></span>
        <div>
          <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${TONES[c.tone]}`}>{c.label}</span>
          <p className="mt-1.5 font-medium">{c.heading}</p>
          <p className="mt-1 text-muted-foreground">{c.body}</p>
        </div>
      </div>
    </section>
  );
}

function LimitTip() {
  return (
    <Tooltip>
      <TooltipTrigger className="rounded-full text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring" aria-label="About the daily sending limit">
        <Info className="size-4" />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Your daily sending limit adjusts based on email delivery health. It can increase when delivery stays healthy and decrease when delivery issues arise.
      </TooltipContent>
    </Tooltip>
  );
}

export function DailyLimitCard({ scenario, showRemaining }: { scenario: EmailScenario; showRemaining: boolean }) {
  const { dailyLimit, raw, sentToday } = scenario;
  const paused = raw === "Paused";
  const remaining = dailyLimit != null && sentToday != null ? remainingToday(dailyLimit, sentToday, raw) : null;
  const pct = dailyLimit && sentToday != null ? Math.min(100, (sentToday / dailyLimit) * 100) : 0;
  return (
    <section className="card-surface p-5" aria-labelledby="lim-h">
      <div className="flex items-center gap-1.5">
        <h2 id="lim-h" className="text-base font-medium">Daily sending limit</h2>
        <LimitTip />
      </div>
      {paused ? (
        <>
          <p className="mt-3 text-3xl font-medium text-danger">Paused</p>
          <p className="mt-1 text-muted-foreground">No emails can be sent while sending is paused.</p>
        </>
      ) : dailyLimit == null ? (
        <>
          <p className="mt-3 text-3xl font-medium text-muted-foreground">—</p>
          <p className="mt-1 text-muted-foreground">Your daily limit can't be displayed right now.</p>
        </>
      ) : (
        <>
          <p className="mt-3"><span className="text-3xl font-medium">{dailyLimit.toLocaleString()}</span> <span className="text-muted-foreground">emails/day</span></p>
          <p className="mt-1 text-muted-foreground">Your daily limit can increase when email delivery stays healthy and decrease when delivery issues arise.</p>
          {showRemaining && remaining != null && (
            <div className="mt-4 border-t pt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={sentToday ?? 0} aria-valuemax={dailyLimit} aria-label="Emails sent today">
                <div className={`h-full ${remaining === 0 ? "bg-warning" : "bg-primary"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{sentToday!.toLocaleString()} sent today</span>
                <span>{remaining.toLocaleString()} remaining today</span>
              </div>
              {remaining === 0 && <p className="mt-2 font-medium text-warning">You've reached today's email sending limit.</p>}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function NoEmailPlan() {
  return (
    <section className="card-surface flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-info-soft text-info"><Ban className="size-5" aria-hidden /></span>
      <h2 className="mt-4 text-base font-medium">Email outreach isn't available on your plan</h2>
      <p className="mt-1 max-w-md text-muted-foreground">Your account doesn't include Email outreach, so there's no email activity or sending limit to show. Contact your Customer Success Manager to learn more.</p>
    </section>
  );
}

export function EmailSummaryCompact({ scenario, search }: { scenario: EmailScenario; search: Record<string, unknown> }) {
  const c = reputationCopy(scenario);
  const paused = scenario.raw === "Paused";
  return (
    <section className="card-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Email delivery</h2>
        <span className="text-xs text-muted-foreground">Email only · doesn't affect Text</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-muted-foreground">Email reputation</dt>
          <dd className="mt-1 flex items-center gap-1.5"><span className={`grid size-6 place-items-center rounded-full ${TONES[c.tone]}`}><c.icon className="size-3.5" aria-hidden /></span><span className="font-medium">{c.label}</span></dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground">Daily sending limit <LimitTip /></dt>
          <dd className="mt-1 font-medium">{paused ? "Paused" : scenario.dailyLimit != null ? `${scenario.dailyLimit.toLocaleString()} emails/day` : "—"}</dd>
        </div>
      </dl>
      <Link to="/" search={{ ...search, channel: "email" } as never} className="mt-4 inline-block text-primary hover:underline">View Email insights →</Link>
    </section>
  );
}
