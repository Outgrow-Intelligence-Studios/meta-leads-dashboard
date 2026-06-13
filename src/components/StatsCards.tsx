import { Users01, Zap, Inbox01, CheckCircle, Calendar, Target01 } from "@untitledui/icons";
import type { Lead } from "../lib/api";

function calculateDelta(current: number, previous: number): { value: string; tone: "up" | "down" | "neutral" } {
  if (previous === 0) {
    return { value: current > 0 ? `+${current}` : "0", tone: current > 0 ? "up" : "neutral" };
  }
  const change = ((current - previous) / previous) * 100;
  const abs = Math.abs(change);
  if (change > 0) return { value: `+${abs.toFixed(1)}%`, tone: "up" };
  if (change < 0) return { value: `-${abs.toFixed(1)}%`, tone: "down" };
  return { value: "0%", tone: "neutral" };
}

export default function StatsCards({ leads }: { leads: Lead[] }) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * DAY;
  const fourteenDaysAgo = now - 14 * DAY;

  const last7 = leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo);
  const prev7 = leads.filter((l) => {
    const t = new Date(l.created_at).getTime();
    return t < sevenDaysAgo && t >= fourteenDaysAgo;
  });

  const last7Count = last7.length;
  const last7Hot = last7.filter((l) => l.status === "Hot").length;
  const prev7Hot = prev7.filter((l) => l.status === "Hot").length;
  const last7Contacted = last7.filter((l) => l.status === "Contacted").length;
  const prev7Contacted = prev7.filter((l) => l.status === "Contacted").length;

  const contactedCount = leads.filter((l) => l.status === "Contacted").length;
  const wonCount = leads.filter((l) => l.status === "Won").length;
  const conversionRate = leads.length > 0 ? (wonCount / leads.length) * 100 : 0;

  const todayStr = new Date().toDateString();
  const followUp1Count = leads.filter(
    (l) => l.follow_up && new Date(l.follow_up).toDateString() === todayStr
  ).length;
  const followUp2Count = leads.filter(
    (l) => l.follow_up_2 && new Date(l.follow_up_2).toDateString() === todayStr
  ).length;

  const hotCount = leads.filter((l) => l.status === "Hot").length;

  const cards = [
    {
      label: "Total leads",
      value: leads.length.toLocaleString(),
      delta: { value: `+${last7Count} this week`, tone: last7Count > 0 ? ("up" as const) : ("neutral" as const) },
      icon: Users01,
      desc: "All-time leads",
    },
    {
      label: "Contacted leads",
      value: contactedCount.toLocaleString(),
      delta: calculateDelta(last7Contacted, prev7Contacted),
      icon: Inbox01,
      desc: "vs previous week",
    },
    {
      label: "Converted (Won)",
      value: wonCount.toLocaleString(),
      delta: { value: `${conversionRate.toFixed(1)}% rate`, tone: "up" as const },
      icon: Target01,
      desc: "Lead to customer",
    },
    {
      label: "Follow Up 1 Today",
      value: followUp1Count.toLocaleString(),
      delta: { value: "Next action due", tone: "neutral" as const },
      icon: Calendar,
      desc: "Tasks for today",
    },
    {
      label: "Follow Up 2 Today",
      value: followUp2Count.toLocaleString(),
      delta: { value: "Final action due", tone: "neutral" as const },
      icon: Calendar,
      desc: "Closes for today",
    },
    {
      label: "Hot Leads",
      value: hotCount.toLocaleString(),
      delta: calculateDelta(last7Hot, prev7Hot),
      icon: Zap,
      desc: "vs previous week",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-secondary bg-primary p-4 shadow-xs transition-all hover:-translate-y-px hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-tertiary">{c.label}</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-primary">
                {c.value}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary ring-1 ring-inset ring-secondary">
              <c.icon className="size-4 text-tertiary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                c.delta.tone === "up"
                  ? "bg-utility-green-50 text-utility-green-700 ring-utility-green-100"
                  : c.delta.tone === "down"
                    ? "bg-utility-red-50 text-utility-red-700 ring-utility-red-100"
                    : "bg-utility-neutral-50 text-utility-neutral-600 ring-utility-neutral-200"
              }`}
            >
              {c.delta.tone === "up" && (
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
              {c.delta.tone === "down" && (
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {c.delta.value}
            </span>
            <span className="text-[10px] text-tertiary">
              {c.desc}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
