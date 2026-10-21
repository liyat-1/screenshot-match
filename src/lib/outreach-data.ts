// ILLUSTRATIVE PROTOTYPE DATA — not production values.
// Rules mirror the shipped warmup behavior described in the design brief.

export type Channel = "text" | "email" | "both";
export type EmailState =
  | "healthy"
  | "at_risk"
  | "paused"
  | "too_few"
  | "unavailable"
  | "no_plan"
  | "cap_reached";

export type RawStatus = "Healthy" | "SteppedDown" | "Paused";

export const WARMUP = {
  initialDailyLimit: 250,
  stepUp: 250,
  approxMaxDaily: 6670,
  monthlyHardCap: 200000,
  floor: 250,
} as const;

/** Client-facing label for a raw warmup status. Missing status is never "Healthy". */
export function clientLabel(raw: RawStatus | null | undefined): "Healthy" | "At risk" | "Paused" | null {
  if (raw === "Healthy") return "Healthy";
  if (raw === "SteppedDown") return "At risk";
  if (raw === "Paused") return "Paused";
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

export interface EmailScenario {
  hasPlan: boolean;
  raw: RawStatus | null;
  dailyLimit: number | null;
  sentToday: number | null;
  tooFewSends: boolean;
}

export const EMAIL_SCENARIOS: Record<EmailState, EmailScenario> = {
  healthy: { hasPlan: true, raw: "Healthy", dailyLimit: 1250, sentToday: 412, tooFewSends: false },
  at_risk: { hasPlan: true, raw: "SteppedDown", dailyLimit: 500, sentToday: 120, tooFewSends: false },
  paused: { hasPlan: true, raw: "Paused", dailyLimit: 250, sentToday: 0, tooFewSends: false },
  too_few: { hasPlan: true, raw: "Healthy", dailyLimit: 250, sentToday: 8, tooFewSends: true },
  unavailable: { hasPlan: true, raw: null, dailyLimit: null, sentToday: null, tooFewSends: false },
  no_plan: { hasPlan: false, raw: null, dailyLimit: null, sentToday: null, tooFewSends: false },
  cap_reached: { hasPlan: true, raw: "Healthy", dailyLimit: 750, sentToday: 750, tooFewSends: false },
};

export const EMAIL_STATE_LABELS: Record<EmailState, string> = {
  healthy: "A · Healthy",
  at_risk: "B · At risk",
  paused: "C · Paused",
  too_few: "D · Too few sends",
  no_plan: "E · No Email plan",
  unavailable: "F · Data unavailable",
  cap_reached: "G · Daily cap reached",
};

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

export function sum(points: DayPoint[], key: keyof Omit<DayPoint, "date">) {
  return points.reduce((a, p) => a + p[key], 0);
}
