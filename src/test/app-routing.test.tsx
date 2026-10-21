import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { Route as OutreachRoute } from "@/routes/index";
import { Route as DiagnoseRoute } from "@/routes/diagnose";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each(["text", "email", "both"])("keeps the %s channel and sending state", (channel) => {
    const validate = OutreachRoute.options.validateSearch;
    if (typeof validate !== "function") throw new Error("Expected Outreach search validator");
    expect(validate({ channel, range: 30, state: "limited", remaining: true })).toEqual({ channel, range: 30, state: "limited", remaining: true });
  });

  it.each(["toString", "constructor", "__proto__", "invalid", "at_risk"])("rejects invalid Outreach state %s", (state) => {
    const validate = OutreachRoute.options.validateSearch;
    if (typeof validate !== "function") throw new Error("Expected Outreach search validator");
    expect(validate({ state })).toMatchObject({ state: "healthy" });
  });

  it.each(["toString", "constructor", "__proto__", "invalid", "investigation"])("rejects invalid Diagnose state %s", (state) => {
    const validate = DiagnoseRoute.options.validateSearch;
    if (typeof validate !== "function") throw new Error("Expected Diagnose search validator");
    expect(validate({ state })).toMatchObject({ state: "healthy" });
  });
});
