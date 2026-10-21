import { describe, expect, it } from "vitest";
import { EMAIL_SCENARIOS, WARMUP, clientLabel, remainingToday, steppedDownLimit, steppedUpLimit, usageTone } from "./outreach-data";

describe("clientLabel (backend → client mapping)", () => {
  it("maps Paused to Paused", () => expect(clientLabel("Paused", true)).toBe("Paused"));
  it("maps SteppedDown to Limited", () => expect(clientLabel("SteppedDown", true)).toBe("Limited"));
  it("maps Active without a qualifying evaluation to Getting started", () => expect(clientLabel("Active", false)).toBe("Getting started"));
  it("maps Active with an evaluation to Healthy", () => expect(clientLabel("Active", true)).toBe("Healthy"));
  it("maps a missing status to null, never Healthy", () => expect(clientLabel(null, false)).toBeNull());
});

describe("remainingToday", () => {
  it("keeps the previous health result and limit when too few emails were sent for evaluation", () => {
    const scenario = EMAIL_SCENARIOS.too_few_sends;
    expect(scenario.sentToday).toBe(24);
    expect(scenario.sentToday).toBeLessThan(WARMUP.minSendsForEval);
    expect(scenario.dailyLimit).toBe(1250);
    expect(scenario.previousDailyLimit).toBe(1250);
    expect(clientLabel(scenario.raw, scenario.evaluated)).toBe("Healthy");
  });
  it("is limit minus sent today", () => expect(remainingToday(1000, 412, "Active")).toBe(588));
  it("is zero while paused", () => expect(remainingToday(250, 0, "Paused")).toBe(0));
  it("never goes negative", () => expect(remainingToday(250, 400, "Active")).toBe(0));
});

describe("limit steps", () => {
  it("step-down halves the limit", () => expect(steppedDownLimit(2500)).toBe(1250));
  it("step-down never goes below 250", () => expect(steppedDownLimit(400)).toBe(250));
  it("step-up adds 250", () => expect(steppedUpLimit(1000)).toBe(1250));
  it("step-up stops at the ~6,670 ceiling", () => expect(steppedUpLimit(6500)).toBe(6670));
});

describe("usageTone", () => {
  it("is blue under 80% used", () => expect(usageTone(79, 100)).toBe("blue"));
  it("is amber from 80–99%", () => expect(usageTone(80, 100)).toBe("amber"));
  it("is grey when the limit is reached", () => expect(usageTone(100, 100)).toBe("grey"));
});
