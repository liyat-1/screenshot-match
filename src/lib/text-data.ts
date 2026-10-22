// ILLUSTRATIVE PROTOTYPE DATA — Text health is a design proposal (#7). Every value is [DATA TBC].
// Text has no warmup and no daily limit. Thresholds are placeholders ({TBD}).

export type TextState =
  | "healthy"
  | "not_enough"
  | "attention_optout"
  | "attention_delivery"
  | "blocked"
  | "loading"
  | "unavailable"
  | "no_sms";

export type TextLabel = "Getting started" | "Healthy" | "Needs attention" | "Blocked" | "Unavailable";

/** Placeholder thresholds, pending product + engineering. */
export const TEXT_TBD = { windowDays: 7, minMessages: 20, deliveryRate: 0.95, optOutRate: 0.02 } as const;

export interface TextScenario {
  hasSms: boolean;
  sent: number | null;
  delivered: number | null;
  optOuts: number | null;
  failures: { reason: string; count: number }[];
  lastSent: string | null;
  lastFailure: string | null;
  lastOptOut: string | null;
  lastStatusChange: string | null;
  statusChange: string | null;
  senderNumber: string;
  senderStatus: string;
  eligibleOptedOut: number;
  eligibleInvalid: number;
}

const BASE = { senderNumber: "+1 (415) 555-0142", senderStatus: "Registered · active", eligibleOptedOut: 214, eligibleInvalid: 96, hasSms: true };

export const TEXT_SCENARIOS: Record<TextState, TextScenario> = {
  healthy: {
    ...BASE, sent: 412, delivered: 401, optOuts: 3,
    failures: [{ reason: "Invalid number", count: 6 }, { reason: "Landline", count: 3 }, { reason: "Unreachable", count: 2 }],
    lastSent: "2026-10-20T14:12:00", lastFailure: "2026-10-20T09:40:00", lastOptOut: "2026-10-18T19:02:00", lastStatusChange: "2026-10-02T06:00:00", statusChange: "Getting started → Healthy",
  },
  not_enough: {
    ...BASE, sent: 9, delivered: 9, optOuts: 0, failures: [],
    lastSent: "2026-10-19T11:20:00", lastFailure: null, lastOptOut: null, lastStatusChange: null, statusChange: null,
  },
  attention_optout: {
    ...BASE, sent: 380, delivered: 371, optOuts: 14,
    failures: [{ reason: "Invalid number", count: 5 }, { reason: "Landline", count: 3 }, { reason: "Unreachable", count: 1 }],
    lastSent: "2026-10-20T13:05:00", lastFailure: "2026-10-20T08:15:00", lastOptOut: "2026-10-20T13:30:00", lastStatusChange: "2026-10-19T06:00:00", statusChange: "Healthy → Needs attention",
  },
  attention_delivery: {
    ...BASE, sent: 420, delivered: 361, optOuts: 4,
    failures: [{ reason: "Invalid number", count: 31 }, { reason: "Carrier filtered", count: 14 }, { reason: "Landline", count: 9 }, { reason: "Unreachable", count: 4 }, { reason: "Other", count: 1 }],
    lastSent: "2026-10-20T13:50:00", lastFailure: "2026-10-20T13:51:00", lastOptOut: "2026-10-17T10:11:00", lastStatusChange: "2026-10-18T06:00:00", statusChange: "Healthy → Needs attention",
  },
  blocked: {
    ...BASE, sent: 0, delivered: 0, optOuts: 0, failures: [{ reason: "Sender suspended", count: 52 }],
    lastSent: "2026-10-18T16:00:00", lastFailure: "2026-10-18T16:00:00", lastOptOut: null, lastStatusChange: "2026-10-18T16:05:00", statusChange: "Healthy → Blocked",
    senderStatus: "Suspended by carriers",
  },
  loading: { ...BASE, sent: null, delivered: null, optOuts: null, failures: [], lastSent: null, lastFailure: null, lastOptOut: null, lastStatusChange: null, statusChange: null },
  unavailable: { ...BASE, sent: null, delivered: null, optOuts: null, failures: [], lastSent: null, lastFailure: null, lastOptOut: null, lastStatusChange: null, statusChange: null },
  no_sms: { ...BASE, hasSms: false, sent: null, delivered: null, optOuts: null, failures: [], lastSent: null, lastFailure: null, lastOptOut: null, lastStatusChange: null, statusChange: null },
};

export const TEXT_STATE_LABELS: Record<TextState, string> = {
  healthy: "T-B · Healthy",
  not_enough: "T-A · Not enough messages",
  attention_optout: "T-C · Needs attention (opt-outs)",
  attention_delivery: "T-C · Needs attention (delivery)",
  blocked: "T-D · Blocked",
  loading: "T-E · Loading",
  unavailable: "T-F · Unavailable",
  no_sms: "No text messaging",
};

export function textLabel(state: TextState): TextLabel | null {
  switch (state) {
    case "healthy": return "Healthy";
    case "not_enough": return "Getting started";
    case "attention_optout":
    case "attention_delivery": return "Needs attention";
    case "blocked": return "Blocked";
    case "no_sms": return null;
    default: return "Unavailable";
  }
}

/** Client copy (brief §2.2.2, verbatim). */
export function textCopy(state: TextState): { headline: string; support: string } {
  switch (state) {
    case "not_enough":
      return { headline: "Not enough texts sent yet to check delivery.", support: "We'll show delivery health once you've sent a few more messages." };
    case "attention_optout":
    case "attention_delivery":
      return { headline: "Some recent texts weren't delivered or led guests to opt out.", support: "Check guest phone numbers and keep messages relevant to avoid carrier filtering." };
    case "blocked":
      return { headline: "Text messages can't be sent right now.", support: "There's an issue with your sending number. Your account manager can help." };
    case "loading":
    case "unavailable":
      return { headline: "We couldn't load your text delivery details right now.", support: "" };
    case "no_sms":
      return { headline: "No text messaging on this property.", support: "" };
    default:
      return { headline: "Your text messages are being delivered well.", support: "Keep sending relevant messages to guests who expect them." };
  }
}

export function deliveryRate(s: TextScenario): number | null {
  if (s.sent == null || s.delivered == null || s.sent === 0) return null;
  return s.delivered / s.sent;
}

export function optOutRate(s: TextScenario): number | null {
  if (s.sent == null || s.optOuts == null || s.sent === 0) return null;
  return s.optOuts / s.sent;
}

/** Internal "Why this status" summary (brief §3.4A). */
export function whyThisTextStatus(state: TextState, s: TextScenario): string {
  const dr = deliveryRate(s);
  const or = optOutRate(s);
  const failed = (s.sent ?? 0) - (s.delivered ?? 0);
  const top = [...s.failures].sort((a, b) => b.count - a.count)[0]?.reason.toLowerCase() ?? "n/a";
  switch (state) {
    case "not_enough":
      return `Only ${s.sent} texts in the last ${TEXT_TBD.windowDays} days (needs ≥${TEXT_TBD.minMessages} {TBD}). Not evaluated yet.`;
    case "attention_optout":
      return `Opt-out rate ${((or ?? 0) * 100).toFixed(2)}% (${s.optOuts} STOP replies) is above the threshold of ${(TEXT_TBD.optOutRate * 100).toFixed(0)}% {TBD}.`;
    case "attention_delivery":
      return `Delivery ${((dr ?? 0) * 100).toFixed(1)}% over the last ${TEXT_TBD.windowDays} days (threshold ${(TEXT_TBD.deliveryRate * 100).toFixed(0)}% {TBD}). ${failed} failed: mostly ${top}.`;
    case "blocked":
      return `Sender ${s.senderNumber} is ${s.senderStatus.toLowerCase()}. No texts can be sent until the number is restored.`;
    case "healthy":
      return `Delivery ${((dr ?? 0) * 100).toFixed(1)}% and opt-outs ${((or ?? 0) * 100).toFixed(2)}% over the last ${TEXT_TBD.windowDays} days — both within thresholds {TBD}.`;
    default:
      return "No text delivery data available.";
  }
}
