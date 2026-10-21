import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BarChart3, CalendarDays, MessageSquarePlus, BedDouble, MessagesSquare, ThumbsUp, LogIn,
  SquareCheck, Mail, ConciergeBell, MessageSquare, Megaphone, Bot, Send, Star, Receipt,
  UserCog, FileCheck2, Bell, ChevronDown, ChevronRight, Info, Stethoscope,
} from "lucide-react";

type Item = { label: string; icon: typeof Mail };
const SECTIONS: { title: string; items: Item[] }[] = [
  { title: "Marketing", items: [
    { label: "Automated invites", icon: MessageSquarePlus },
    { label: "Automated transactional", icon: BedDouble },
    { label: "Drip campaign", icon: MessagesSquare },
    { label: "Guest responses", icon: ThumbsUp },
    { label: "Before stay", icon: LogIn },
    { label: "Site abandonment", icon: SquareCheck },
  ]},
  { title: "Marketing assets", items: [{ label: "Email Templates", icon: Mail }] },
  { title: "In property", items: [
    { label: "Arrivals & In-house", icon: ConciergeBell },
    { label: "Messaging", icon: MessageSquare },
    { label: "Announcements", icon: Megaphone },
    { label: "Chatbot", icon: Bot },
    { label: "Direct messages", icon: Send },
  ]},
  { title: "Guest reviews", items: [{ label: "Review ratings", icon: Star }] },
  { title: "Account", items: [
    { label: "Billing and payments", icon: Receipt },
    { label: "User Management", icon: UserCog },
    { label: "Compliance", icon: FileCheck2 },
    { label: "Configure notifications", icon: Bell },
  ]},
];

const ANALYTICS_SUB = ["Subscriptions", "Outreach", "OTA Outreach", "Reviews", "Conversions"];

export function AppShell({ crumb, active, children }: { crumb: string; active: "outreach" | "diagnose"; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-sm">
      <aside className="hidden w-[220px] shrink-0 border-r bg-shell lg:block">
        <div className="flex h-[60px] items-center gap-2 border-b px-4 font-medium">
          <span className="grid size-5 place-items-center rounded-md bg-foreground text-[10px] text-shell">D</span>
          <span className="truncate">Hellas Gadgets Kallithea</span>
          <ChevronDown className="ml-auto size-4 text-primary" />
        </div>
        <nav className="py-3">
          <div className="flex items-center gap-3 px-5 py-1.5 font-medium text-primary">
            <BarChart3 className="size-4" /> Analytics
          </div>
          <ul className="ml-[27px] border-l">
            {ANALYTICS_SUB.map((s) => (
              <li key={s}>
                {s === "Outreach" ? (
                  <Link to="/" search={{ channel: "both", range: 15, state: "healthy", remaining: false }} className={`block rounded-r-md py-1.5 pl-4 transition-colors ${active === "outreach" ? "bg-accent font-medium text-primary" : "text-foreground/80 hover:bg-muted/70 hover:text-primary"}`}>{s}</Link>
                ) : (
                  <span className="block cursor-default rounded-r-md py-1.5 pl-4 text-foreground/70">{s}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="mx-2 flex items-center gap-3 rounded-md px-3 py-1.5 text-foreground/80 transition-colors hover:bg-muted/70"><CalendarDays className="size-4 text-muted-foreground" /> Bookings</div>
          {SECTIONS.map((sec) => (
            <div key={sec.title} className="mt-2 border-t pt-3">
              <p className="px-5 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">{sec.title}</p>
              {sec.items.map((it) => (
                <div key={it.label} className="mx-2 flex items-center gap-3 rounded-md px-3 py-1.5 text-foreground/80 transition-colors hover:bg-muted/70 hover:text-foreground">
                  <it.icon className="size-4 text-muted-foreground" /> {it.label}
                </div>
              ))}
            </div>
          ))}
          <div className="mt-2 border-t pt-3">
            <p className="px-5 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Internal · CSM / Admin</p>
            <Link to="/diagnose" search={{ state: "healthy" }} className={`mx-2 flex items-center gap-3 rounded-md px-3 py-1.5 transition-colors ${active === "diagnose" ? "bg-accent font-medium text-primary" : "text-foreground/80 hover:bg-muted/70 hover:text-primary"}`}>
              <Stethoscope className="size-4" /> Diagnose
            </Link>
          </div>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] items-center border-b bg-shell px-6">
          <span className="text-lg text-primary">{active === "diagnose" ? "Internal" : "Analytics"}</span>
          <ChevronRight className="mx-2 size-4 text-muted-foreground" />
          <span className="text-lg font-medium">{crumb}</span>
          <Info className="ml-auto size-5 text-primary" aria-label="Page information" />
        </header>
        <nav className="flex gap-4 border-b bg-shell px-6 py-3 lg:hidden" aria-label="Prototype pages">
          <Link to="/" search={{ channel: "both", range: 15, state: "healthy", remaining: false }} aria-current={active === "outreach" ? "page" : undefined} className={active === "outreach" ? "font-medium text-primary" : "text-muted-foreground"}>Outreach</Link>
          <Link to="/diagnose" search={{ state: "healthy" }} aria-current={active === "diagnose" ? "page" : undefined} className={active === "diagnose" ? "font-medium text-primary" : "text-muted-foreground"}>Diagnose</Link>
        </nav>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
