import { describe, expect, it } from "vitest";
import { clientLabel, remainingToday, steppedDownLimit, steppedUpLimit } from "./outreach-data";

describe("warmup rules", () => {
  it("step-down halves the limit", () => expect(steppedDownLimit(2000)).toBe(1000));
  it("step-down never goes below 250", () => expect(steppedDownLimit(400)).toBe(250));
  it("healthy evaluation adds 250", () => expect(steppedUpLimit(500)).toBe(750));
  it("stepped-down maps to At risk", () => expect(clientLabel("SteppedDown")).toBe("At risk"));
  it("missing status is not Healthy", () => expect(clientLabel(null)).toBeNull());
  it("remaining never negative", () => expect(remainingToday(250, 300, "Healthy")).toBe(0));
  it("paused has zero remaining", () => expect(remainingToday(250, 0, "Paused")).toBe(0));
});
