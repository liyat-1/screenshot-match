import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Home } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SampleBanner } from "@/components/SampleBanner";
import { ActivityChart, LocationCard, SegmentsCard, StatCard } from "@/components/outreach/Cards";
import { DailyLimitCard, EmailSummaryCompact, NoEmailPlan, ReputationCard } from "@/components/outreach/EmailStatus";
import { EMAIL_SCENARIOS, EMAIL_STATE_LABELS, RANGES, segments, series, sum, type Channel, type EmailState } from "@/lib/outreach-data";

type Search = { channel: Channel; range: number; state: EmailState; remaining: boolean };

export const Route = createFileRoute("/")({
  validateSearch: (s: Partial<Record<keyof Search, unknown>>): Search => ({
    channel: (["text", "email", "both"].includes(s.channel as string) ? s.channel : "text") as Channel,
    range: [7, 15, 30].includes(Number(s.range)) ? Number(s.range) : 15,
    state: (typeof s.state === "string" && Object.hasOwn(EMAIL_SCENARIOS, s.state) ? s.state : "healthy") as EmailState,
    remaining: s.remaining === true || s.remaining === "true",
  }),
  head: () => ({
    meta: [
      { title: "Outreach analytics — Text & Email | Directful" },
      { name: "description", content: "Outreach analytics by channel with email reputation and daily sending limit." },
      { property: "og:title", content: "Outreach analytics — Text & Email | Directful" },
      { property: "og:description", content: "Outreach analytics by channel with email reputation and daily sending limit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Outreach,
});

const TABS: { id: Channel; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "email", label: "Email" },
  { id: "both", label: "Text + Email" },
];

function Outreach() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const scenario = EMAIL_SCENARIOS[search.state];
  const tabs = scenario.hasPlan ? TABS : TABS.filter((t) => t.id === "text");
  const channel: Channel = scenario.hasPlan ? search.channel : search.channel === "text" ? "text" : "email";
  const data = series(search.range);

  return (
    <AppShell crumb="Outreach" active="outreach">
      <SampleBanner>
        <label className="flex items-center gap-2 text-sm">Email state
          <select className="rounded-sm border border-sample bg-card px-2 py-1 text-foreground" value={search.state}
            onChange={(e) => {
              const state = e.currentTarget.value as EmailState;
              navigate({ search: (p) => ({ ...p, state }) });
            }}>
            {Object.entries(EMAIL_STATE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={search.remaining} onChange={(e) => {
            const remaining = e.currentTarget.checked;
            navigate({ search: (p) => ({ ...p, remaining }) });
          }} />
          Remaining-today variant
        </label>
      </SampleBanner>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b">
        <nav className="flex items-end gap-1" aria-label="Analytics">
          <Home className="mb-3 mr-3 size-5 text-muted-foreground" aria-hidden />
          {["Subscriptions", "Outreach", "OTA Outreach", "Reviews", "Conversions"].map((t) => (
            <span key={t} aria-current={t === "Outreach" ? "page" : undefined}
              className={`px-4 pb-3 text-base ${t === "Outreach" ? "-mb-px border-b-2 border-primary font-medium text-foreground" : "text-muted-foreground"}`}>{t}</span>
          ))}
        </nav>
        <label className="mb-2 flex items-center gap-2 rounded-sm border border-primary/40 bg-card px-3 py-2">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">Date range</span>
          <select className="bg-transparent outline-none" value={search.range} onChange={(e) => {
            const range = Number(e.currentTarget.value);
            navigate({ search: (p) => ({ ...p, range }) });
          }}>
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
      </div>

      <nav className="mt-4 inline-flex rounded-sm border bg-card p-0.5" aria-label="Outreach channel">
        {tabs.map((t) => (
          <Link key={t.id} to="/" search={{ ...search, channel: t.id }} aria-current={channel === t.id ? "page" : undefined}
            className={`rounded-sm px-4 py-1.5 transition-colors ${channel === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        {channel === "text" && <TextView data={data} range={search.range} />}
        {channel === "email" && (scenario.hasPlan ? <EmailView data={data} range={search.range} search={search} /> : <NoEmailPlan />)}
        {channel === "both" && <BothView data={data} range={search.range} search={search} />}
      </div>
    </AppShell>
  );
}

type V = { data: ReturnType<typeof series>; range: number };

function TextView({ data, range }: V) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <LocationCard title="Reached guests by location · Text" />
      <SegmentsCard title="Outreach by segments · Text" data={segments("text", range)} />
      <div className="xl:col-span-2">
        <ActivityChart title="Text messages & clicks" data={data} defs={[
          { key: "textMessages", label: "messages", color: "var(--series-text)", axis: "left" },
          { key: "textClicks", label: "clicks", color: "var(--series-clicks)", dashed: true, axis: "right" },
        ]} />
      </div>
    </div>
  );
}

function EmailView({ data, range, search }: V & { search: Search }) {
  const scenario = EMAIL_SCENARIOS[search.state];
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <ReputationCard scenario={scenario} />
        <DailyLimitCard scenario={scenario} showRemaining={search.remaining || search.state === "cap_reached"} />
      </div>
      <p className="text-xs text-muted-foreground">Reputation and daily limit reflect today (hotel-local time). Analytics below follow the selected date range.</p>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <LocationCard title="Reached guests by location · Email" />
        <SegmentsCard title="Outreach by segments · Email" data={segments("email", range)} />
        <div className="xl:col-span-2">
          <ActivityChart title="Email messages & clicks" data={data} defs={[
            { key: "emailMessages", label: "emails sent", color: "var(--series-email)", axis: "left" },
            { key: "emailClicks", label: "clicks", color: "var(--series-clicks)", dashed: true, axis: "right" },
          ]} />
        </div>
      </div>
    </div>
  );
}

function BothView({ data, range, search }: V & { search: Search }) {
  const scenario = EMAIL_SCENARIOS[search.state];
  const t = segments("text", range).reduce((a, s) => a + s.count, 0);
  const e = segments("email", range).reduce((a, s) => a + s.count, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card-surface p-5">
          <h2 className="text-base font-medium">Text</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatCard label="Guests reached" value={t} sub="via Text" />
            <StatCard label="Messages" value={sum(data, "textMessages")} sub="sent" />
            <StatCard label="Clicks" value={sum(data, "textClicks")} sub="on links" />
          </div>
        </section>
        <section className="card-surface p-5">
          <h2 className="text-base font-medium">Email</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatCard label="Guests reached" value={e} sub="via Email" />
            <StatCard label="Emails" value={sum(data, "emailMessages")} sub="sent" />
            <StatCard label="Clicks" value={sum(data, "emailClicks")} sub="on links" />
          </div>
        </section>
        <EmailSummaryCompact scenario={scenario} search={search} />
      </div>
      <p className="text-xs text-muted-foreground">Reach is shown per channel. A guest contacted on both channels appears in each, so the two aren't added together.</p>
      <div className="grid gap-5 xl:grid-cols-2">
        <ActivityChart title="Messages by channel" note="Text messages and emails sent" data={data} defs={[
          { key: "textMessages", label: "Text", color: "var(--series-text)", axis: "left" },
          { key: "emailMessages", label: "Email", color: "var(--series-email)", dashed: true, axis: "right" },
        ]} />
        <ActivityChart title="Clicks by channel" note="Link clicks per channel" data={data} defs={[
          { key: "textClicks", label: "Text", color: "var(--series-text)", axis: "left" },
          { key: "emailClicks", label: "Email", color: "var(--series-email)", dashed: true, axis: "right" },
        ]} />
        <SegmentsCard title="Outreach by segments · Text" data={segments("text", range)} />
        <SegmentsCard title="Outreach by segments · Email" data={segments("email", range)} />
      </div>
    </div>
  );
}
