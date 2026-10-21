import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Home, Mail, MessageSquare, MessagesSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Annotate, SampleBanner } from "@/components/SampleBanner";
import { ActivityChart, DripCard, KpiStrip, LocationCard, OtaCard, SegmentsCard, SplitSegmentsCard } from "@/components/outreach/Cards";
import { CompactHealthCard, DailyLimitCard, EmailHealthCard, NoEmailPlan, PausedBanner, TipsPanel } from "@/components/outreach/EmailStatus";
import { EMAIL_SCENARIOS, EMAIL_STATE_LABELS, RANGES, segments, segmentsSplit, series, sum, type Channel, type EmailState } from "@/lib/outreach-data";
import { useState } from "react";

type Search = { channel: Channel; range: number; state: EmailState; remaining: boolean };

export const Route = createFileRoute("/")({
  validateSearch: (s: Partial<Record<keyof Search, unknown>>): Search => ({
    channel: (["text", "email", "both"].includes(s.channel as string) ? s.channel : "both") as Channel,
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

const TABS: { id: Channel; label: string; icon: typeof Mail }[] = [
  { id: "text", label: "Text", icon: MessageSquare },
  { id: "email", label: "Email", icon: Mail },
  { id: "both", label: "Text + Email", icon: MessagesSquare },
];

function ChannelSwitch({ channel, onSelect }: { channel: Channel; onSelect: (c: Channel) => void }) {
  const onKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === channel);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (step !== 0) onSelect(TABS[(i + step + TABS.length) % TABS.length]?.id ?? channel);
  };
  return (
    <div role="tablist" aria-label="Outreach channel" onKeyDown={onKey}
      className="inline-flex h-10 items-center rounded-md bg-muted p-1 shadow-inner">
      {TABS.map((t) => {
        const selected = channel === t.id;
        return (
          <button key={t.id} role="tab" aria-selected={selected} onClick={() => onSelect(t.id)}
            className={`flex h-8 min-w-24 items-center justify-center gap-1.5 rounded px-3 text-sm transition-all focus-visible:outline-2 focus-visible:outline-ring ${
              selected ? "bg-card font-medium text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="size-4" aria-hidden /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Outreach() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const scenario = EMAIL_SCENARIOS[search.state];
  const channel: Channel = search.channel;
  const data = series(search.range);
  const [tipsOpen, setTipsOpen] = useState(false);
  const rangeLabel = RANGES.find((r) => r.value === search.range)?.label ?? "Last 15 days";

  const setSearch = (patch: Partial<Search>) => navigate({ search: (p) => ({ ...p, ...patch }) });

  return (
    <AppShell crumb="Outreach" active="outreach">
      <SampleBanner>
        <label className="flex items-center gap-2 text-sm">Email state
          <select className="rounded-sm border border-sample bg-card px-2 py-1 text-foreground" value={search.state}
            onChange={(e) => setSearch({ state: e.currentTarget.value as EmailState })}>
            {Object.entries(EMAIL_STATE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </SampleBanner>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b">
        <nav className="flex items-end gap-1" aria-label="Analytics">
          <Home className="mb-3 mr-3 size-5 text-muted-foreground" aria-hidden />
          {["Subscriptions", "Outreach", "OTA Outreach", "Reviews", "Conversions"].map((t) => (
            <span key={t} aria-current={t === "Outreach" ? "page" : undefined}
              className={`px-4 pb-3 text-base transition-colors ${t === "Outreach" ? "-mb-px border-b-2 border-primary font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t}</span>
          ))}
        </nav>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ChannelSwitch channel={channel} onSelect={(c) => setSearch({ channel: c })} />
        <label className="flex items-center gap-2 rounded-md border border-primary/40 bg-card px-3 py-2 shadow-sm transition-colors hover:border-primary/70">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">Date range</span>
          <select className="bg-transparent outline-none" value={search.range} onChange={(e) => setSearch({ range: Number(e.currentTarget.value) })}>
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-2"><Annotate>Segmented control, not tabs, to avoid three levels of navigation. The choice is kept in the URL (?channel=). Without an Email plan, the Email and Text + Email views show an empty state with a contact CTA.</Annotate></div>

      <div className="mt-5">
        {channel === "text" && <TextView data={data} range={search.range} />}
        {channel === "email" && (scenario.hasPlan ? (
          <EmailView data={data} range={search.range} rangeLabel={rangeLabel} search={search} onOpenTips={() => setTipsOpen(true)} />
        ) : <NoEmailPlan />)}
        {channel === "both" && <BothView data={data} range={search.range} search={search} />}
      </div>

      <TipsPanel open={tipsOpen} onClose={() => setTipsOpen(false)} />
    </AppShell>
  );
}

type V = { data: ReturnType<typeof series>; range: number };

function TextView({ data, range }: V) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <ActivityChart title="Text messages & clicks" data={data} defs={[
          { key: "textMessages", label: "messages", color: "var(--series-text)", axis: "left" },
          { key: "textClicks", label: "clicks", color: "var(--series-clicks)", dashed: true, axis: "right" },
        ]} />
      </div>
      <SegmentsCard title="Outreach by segments" data={segments("text", range)} />
      <OtaCard />
      <DripCard value={21} />
      <LocationCard title="Reached guests by location" />
    </div>
  );
}

function EmailView({ data, range, rangeLabel, search, onOpenTips }: V & { rangeLabel: string; search: Search; onOpenTips: () => void }) {
  const scenario = EMAIL_SCENARIOS[search.state];
  return (
    <div className="space-y-5">
      {search.state === "paused" && <PausedBanner />}
      <EmailHealthCard state={search.state} scenario={scenario} onOpenTips={onOpenTips} />
      <DailyLimitCard state={search.state} scenario={scenario} onOpenTips={onOpenTips} />
      <Annotate>The health and limit cards are live (today) and ignore the date picker on purpose. Everything below follows the date range.</Annotate>
      <div className="border-t pt-4">
        <h2 className="text-sm font-medium text-muted-foreground">Email activity · {rangeLabel}</h2>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart title="Marketing emails & clicks" data={data} defs={[
            { key: "emailMessages", label: "emails sent", color: "var(--series-email)", axis: "left" },
            { key: "emailClicks", label: "clicks", color: "var(--series-clicks)", dashed: true, axis: "right" },
          ]} />
        </div>
        <SegmentsCard title="Outreach by segments · Email" data={segments("email", range)} unit="email recipients in total" />
        <DripCard value={1184} label="guests reached by email drip" />
        <div className="xl:col-span-2"><LocationCard title="Reached guests by location" /></div>
      </div>
    </div>
  );
}

function BothView({ data, range, search }: V & { search: Search }) {
  const scenario = EMAIL_SCENARIOS[search.state];
  const hasPlan = scenario.hasPlan;
  const textSent = sum(data, "textMessages");
  const emailSent = sum(data, "emailMessages");
  const textReached = segments("text", range).reduce((a, s) => a + s.count, 0);
  const reached = textReached + segments("email", range).reduce((a, s) => a + s.count, 0);
  return (
    <div className="space-y-5">
      {search.state === "paused" && <PausedBanner />}
      <KpiStrip cells={hasPlan ? [
        { label: "Text messages sent", value: textSent },
        { label: "Emails sent", value: emailSent },
        { label: "Guests reached (all channels)", value: reached },
      ] : [
        { label: "Text messages sent", value: textSent },
        { label: "Emails sent", value: 0 },
        { label: "Guests reached (all channels)", value: textReached },
      ]} />
      <Annotate>Unique guests across channels need engineering confirmation; if not possible, show "Messages sent (total)" instead.</Annotate>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart title="Messages & clicks by channel" data={data} defs={hasPlan ? [
            { key: "textMessages", label: "Text", color: "var(--series-text)", axis: "left" },
            { key: "emailMessages", label: "Email", color: "var(--series-email)", axis: "left" },
            { key: "textClicks", label: "Text clicks", color: "var(--series-text)", dashed: true, axis: "right" },
            { key: "emailClicks", label: "Email clicks", color: "var(--series-email)", dashed: true, axis: "right" },
          ] : [
            { key: "textMessages", label: "Text", color: "var(--series-text)", axis: "left" },
            { key: "textClicks", label: "Text clicks", color: "var(--series-text)", dashed: true, axis: "right" },
          ]} />
        </div>
        {hasPlan ? <CompactHealthCard state={search.state} scenario={scenario} search={search} /> : <NoEmailPlan compact />}
      </div>
      {hasPlan ? (
        <SplitSegmentsCard title="Outreach by segments" data={segmentsSplit(range)} />
      ) : (
        <SegmentsCard title="Outreach by segments" data={segments("text", range)} />
      )}
      <Annotate>No blended reputation. Email health is shown only for email.</Annotate>
      <div className="grid gap-5 xl:grid-cols-3">
        <DripCard value={1205} />
        <div className="xl:col-span-2"><LocationCard title="Reached guests by location" /></div>
      </div>
    </div>
  );
}
