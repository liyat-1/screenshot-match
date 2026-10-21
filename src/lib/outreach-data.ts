// ILLUSTRATIVE PROTOTYPE DATA — not production values.
// Rules mirror the shipped warmup behavior described in the design brief.

export type Channel = "text" | "email" | "both";
export type EmailState =
  | "getting_started"
  | "healthy"
  | "at_ceiling"
  | "limited"
  | "paused"
  | "limit_reached"
  | "monthly_cap"
  | "loading"
  | "unavailable"
  | "no_plan";

export type RawStatus = "Active" | "SteppedDown" | "Paused";

export const WARMUP = {
  initialDailyLimit: 250,
  stepUp: 250,
  approxMaxDaily: 6670,
  monthlyHardCap: 200000,
  floor: 250,
  minSendsForEval: 50,
} as const;

export const HOTEL_TZ = "EET";
export const HOTEL_NAME = "Hellas Gadgets Kallithea";

export type ClientLabel = "Getting started" | "Healthy" | "Limited" | "Paused";

/** Backend status + fields map to the client label (design brief §2.5 mapping rule). */
export function clientLabel(raw: RawStatus | null | undefined, evaluated: boolean): ClientLabel | null {
  if (raw === "Paused") return "Paused";
  if (raw === "SteppedDown") return "Limited";
  if (raw === "Active") return evaluated ? "Healthy" : "Getting started";
  return null;
}

/** Remaining emails today: never negative, never above the cap, zero while paused. */
export function remainingToday(cap: number, sentToday: number, raw: RawStatus | null): number {
  if (raw === "Paused") return 0;
  return Math.max(0, Math.min(cap, cap - sentToday));
}

/** Step-down halves the limit with a floor of 250. */
export function steppedDownLimit(current: number): number {
  return Math.max(WARMUP.floor, Math.floor(current / 2));
}

/** A healthy evaluation adds 250 toward the approximate ceiling. */
export function steppedUpLimit(current: number): number {
  return Math.min(WARMUP.approxMaxDaily, current + WARMUP.stepUp);
}

/** Usage bar fill: blue under 80%, amber 80–99%, grey when the limit is reached. */
export function usageTone(sent: number, limit: number): "blue" | "amber" | "grey" {
  if (limit <= 0 || sent >= limit) return "grey";
  return sent / limit >= 0.8 ? "amber" : "blue";
}

export interface EmailScenario {
  hasPlan: boolean;
  raw: RawStatus | null;
  evaluated: boolean;
  dailyLimit: number | null;
  previousDailyLimit: number | null;
  sentToday: number | null;
  monthlySent: number | null;
  monthlyLimit: number;
  consecutiveHealthy: number | null;
  bounce: number | null;
  spam: number | null;
  unsub: number | null;
  lastEvaluatedOn: string | null;
  lastStepDownOn: string | null;
  pausedOn: string | null;
  textEligible: number;
  emailEligible: number | null;
  emailWithAddress: number;
  emailUnsubscribed: number;
  emailSuppressed: number;
}

const BASE = {
  monthlyLimit: WARMUP.monthlyHardCap,
  textEligible: 5310,
  emailEligible: 8042 as number | null,
  emailWithAddress: 9120,
  emailUnsubscribed: 640,
  emailSuppressed: 438,
};

export const EMAIL_SCENARIOS: Record<EmailState, EmailScenario> = {
  getting_started: {
    ...BASE, hasPlan: true, raw: "Active", evaluated: false,
    dailyLimit: 250, previousDailyLimit: null, sentToday: 8, monthlySent: 812,
    consecutiveHealthy: 0, bounce: null, spam: null, unsub: null,
    lastEvaluatedOn: null, lastStepDownOn: null, pausedOn: null,
  },
  healthy: {
    ...BASE, hasPlan: true, raw: "Active", evaluated: true,
    dailyLimit: 1250, previousDailyLimit: 1000, sentToday: 412, monthlySent: 18420,
    consecutiveHealthy: 3, bounce: 0.012, spam: 0.0002, unsub: 0.004,
    lastEvaluatedOn: "2026-10-20T06:00:00", lastStepDownOn: null, pausedOn: null,
  },
  at_ceiling: {
    ...BASE, hasPlan: true, raw: "Active", evaluated: true,
    dailyLimit: 6670, previousDailyLimit: 6420, sentToday: 3120, monthlySent: 96400,
    consecutiveHealthy: 26, bounce: 0.008, spam: 0.0001, unsub: 0.002,
    lastEvaluatedOn: "2026-10-20T06:00:00", lastStepDownOn: null, pausedOn: null,
  },
  limited: {
    ...BASE, hasPlan: true, raw: "SteppedDown", evaluated: true,
    dailyLimit: 1250, previousDailyLimit: 2500, sentToday: 120, monthlySent: 22150,
    consecutiveHealthy: 0, bounce: 0.031, spam: 0.003, unsub: 0.0071,
    lastEvaluatedOn: "2026-10-20T06:00:00", lastStepDownOn: "2026-10-18T06:00:00", pausedOn: null,
  },
  paused: {
    ...BASE, hasPlan: true, raw: "Paused", evaluated: true,
    dailyLimit: 250, previousDailyLimit: 500, sentToday: 0, monthlySent: 4208,
    consecutiveHealthy: 1, bounce: 0.124, spam: 0.001, unsub: 0.009,
    lastEvaluatedOn: "2026-10-20T06:00:00", lastStepDownOn: "2026-10-17T06:00:00", pausedOn: "2026-10-19T06:00:00",
  },
  limit_reached: {
    ...BASE, hasPlan: true, raw: "Active", evaluated: true,
    dailyLimit: 750, previousDailyLimit: 500, sentToday: 750, monthlySent: 12980,
    consecutiveHealthy: 2, bounce: 0.011, spam: 0.0002, unsub: 0.003,
    lastEvaluatedOn: "2026-10-20T06:00:00", lastStepDownOn: null, pausedOn: null,
  },
  monthly_cap: {
    ...BASE, hasPlan: true, raw: "Active", evaluated: true,
    dailyLimit: 6670, previousDailyLimit: 6670, sentToday: 0, monthlySent: 200000,
    consecutiveHealthy: 18, bounce: 0.009, spam: 0.0001, unsub: 0.002,
    lastEvaluatedOn: "2026-10-20T06:00:00", lastStepDownOn: null, pausedOn: null,
  },
  loading: {
    ...BASE, hasPlan: true, raw: null, evaluated: false,
    dailyLimit: null, previousDailyLimit: null, sentToday: null, monthlySent: null,
    consecutiveHealthy: null, bounce: null, spam: null, unsub: null,
    lastEvaluatedOn: null, lastStepDownOn: null, pausedOn: null,
  },
  unavailable: {
    ...BASE, hasPlan: true, raw: null, evaluated: false,
    dailyLimit: null, previousDailyLimit: null, sentToday: null, monthlySent: null,
    consecutiveHealthy: null, bounce: null, spam: null, unsub: null,
    lastEvaluatedOn: null, lastStepDownOn: null, pausedOn: null,
  },
  no_plan: {
    ...BASE, hasPlan: false, raw: null, evaluated: false,
    dailyLimit: null, previousDailyLimit: null, sentToday: null, monthlySent: null,
    consecutiveHealthy: null, bounce: null, spam: null, unsub: null,
    lastEvaluatedOn: null, lastStepDownOn: null, pausedOn: null, emailEligible: null,
  },
};

export const EMAIL_STATE_LABELS: Record<EmailState, string> = {
  getting_started: "A · Getting started",
  healthy: "B1 · Healthy, growing",
  at_ceiling: "B2 · Healthy, at full limit",
  limited: "C · Limited",
  paused: "D · Paused",
  limit_reached: "E · Today's limit reached",
  monthly_cap: "F · Monthly limit reached",
  loading: "G · Loading",
  unavailable: "H · Unavailable",
  no_plan: "No Email plan",
};

/** Client-facing copy per state (design brief §2.5, verbatim). */
export function clientCopy(state: EmailState): { headline: string; support: string } {
  switch (state) {
    case "getting_started":
      return {
        headline: "You can send up to 250 emails a day while we get to know your sending.",
        support: "Once you've sent at least 50 emails in a day, we'll check delivery and your limit can start to grow.",
      };
    case "at_ceiling":
      return {
        headline: "You're at your full daily email limit.",
        support: "Keep delivery healthy to keep this limit.",
      };
    case "limited":
      return {
        headline: "We've lowered your daily limit to protect your delivery.",
        support: "Some recent emails bounced or were marked as spam. Your limit will grow again once delivery improves.",
      };
    case "paused":
      return {
        headline: "Email sending is paused.",
        support: "Too many recent emails couldn't be delivered. Sending resumes automatically once delivery checks pass.",
      };
    case "monthly_cap":
      return {
        headline: "You've reached this month's email limit of 200,000.",
        support: "Sending resumes on November 1.",
      };
    case "unavailable":
    case "loading":
      return {
        headline: "We couldn't load your email sending details right now.",
        support: "",
      };
    default:
      return {
        headline: "Your emails are being delivered well.",
        support: "Your daily limit increases as long as delivery stays healthy.",
      };
  }
}

/** Internal "Why this limit" summary (design brief §3.2A). */
export function whyThisLimit(state: EmailState, s: EmailScenario): string {
  const sent24 = s.sentToday ?? 0;
  switch (state) {
    case "getting_started":
      return `New on email. Starting limit 250/day. Not yet evaluated: needs ≥50 sends in 24h (sent ${sent24} in the last 24h).`;
    case "healthy":
    case "limit_reached":
      return `Healthy for ${s.consecutiveHealthy} evaluations in a row. Next healthy evaluation raises the limit to ${(s.dailyLimit ?? 0) + 250}/day (ceiling ~6,670).`;
    case "at_ceiling":
      return "At the maximum daily limit (~6,670/day).";
    case "limited":
      return `Limit cut 50% on ${fmtDate(s.lastStepDownOn)}: spam 0.30% > 0.10%. Recovers +250 per healthy evaluation.`;
    case "paused":
      return `Paused on ${fmtDate(s.pausedOn)}: bounce 12.40% > 10%. Resumes after 2 consecutive healthy evaluations (${s.consecutiveHealthy}/2 so far).`;
    case "monthly_cap":
      return `Monthly limit reached (${(s.monthlySent ?? 0).toLocaleString()}/200,000). Resets November 1.`;
    default:
      return "No warmup data available.";
  }
}

export function fmtDate(v: string | null): string {
  if (v == null) return "—";
  return new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 15, label: "Last 15 days" },
  { value: 30, label: "Last 30 days" },
] as const;

const END = new Date(2026, 9, 20);
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface DayPoint {
  date: string;
  textMessages: number;
  textClicks: number;
  emailMessages: number;
  emailClicks: number;
}

export function series(days: number): DayPoint[] {
  const rText = seeded(7);
  const rEmail = seeded(19);
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(END);
    d.setDate(END.getDate() - i);
    const t = rText() > 0.6 ? Math.round(rText() * 4) : 0;
    const e = Math.round(40 + rEmail() * 120);
    out.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      textMessages: t,
      textClicks: t > 0 ? Math.round(rText() * t * 2) : 0,
      emailMessages: e,
      emailClicks: Math.round(e * (0.03 + rEmail() * 0.05)),
    });
  }
  return out;
}

export interface Segment {
  name: string;
  count: number;
}

export function segments(channel: "text" | "email", days: number): Segment[] {
  const k = days / 15;
  const base =
    channel === "text"
      ? [
          ["Sales agent", 8],
          ["OTA guests", 7],
          ["After last visit", 2],
          ["Announcement", 2],
          ["Review", 1],
          ["Booking updated", 1],
        ]
      : [
          ["Announcement", 640],
          ["After last visit", 410],
          ["Before stay", 288],
          ["Review", 152],
          ["Site abandonment", 74],
        ];
  return base.map(([name, c]) => ({ name: name as string, count: Math.max(1, Math.round((c as number) * k)) }));
}

export interface SplitSegment {
  name: string;
  text: number;
  email: number;
}

export function segmentsSplit(days: number): SplitSegment[] {
  const k = days / 15;
  const base: [string, number, number][] = [
    ["Sales agent", 8, 120],
    ["OTA guests", 7, 96],
    ["After last visit", 2, 410],
    ["Announcement", 2, 640],
    ["Review", 1, 152],
    ["Booking updated", 1, 34],
  ];
  return base.map(([name, t, e]) => ({
    name,
    text: Math.max(1, Math.round(t * k)),
    email: Math.max(1, Math.round(e * k)),
  }));
}

export function sum(points: DayPoint[], key: keyof Omit<DayPoint, "date">) {
  return points.reduce((a, p) => a + p[key], 0);
}
