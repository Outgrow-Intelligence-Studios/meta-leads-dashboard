import { Users01, Zap, Inbox01, CheckCircle } from "@untitledui/icons";
import type { Lead } from "../lib/api";

function calculateDelta(current: number, previous: number): { value: string; tone: "up" | "down" | "neutral" } {
  if (previous === 0) {
    return { value: current > 0 ? "+\u221E%" : "0%", tone: current > 0 ? "up" : "neutral" };
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
  const prev7Count = prev7.length;
  const last7Hot = last7.filter((l) => l.status === "Hot").length;
  const prev7Hot = prev7.filter((l) => l.status === "Hot").length;
  const last7Contacted = last7.filter((l) => l.status === "Contacted").length;
  const prev7Contacted = prev7.filter((l) => l.status === "Contacted").length;

  const contactRate7 = last7Count > 0 ? (last7Contacted / last7Count) * 100 : 0;
  const contactRatePrev = prev7Count > 0 ? (prev7Contacted / prev7Count) * 100 : 0;
  const today = leads.filter((l) => {
    const d = new Date(l.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length;
  const yesterday = leads.filter((l) => {
    const d = new Date(l.created_at);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  }).length;

  const cards = [
    {
      label: "Total leads",
      value: leads.length.toLocaleString(),
      delta: { value: `+${last7Count} this week`, tone: last7Count > 0 ? ("up" as const) : ("neutral" as const) },
      icon: Users01,
    },
    {
      label: "Hot leads",
      value: last7Hot.toLocaleString(),
      delta: calculateDelta(last7Hot, prev7Hot),
      icon: Zap,
    },
    {
      label: "Contact rate",
      value: `${Math.round(contactRate7)}%`,
      delta: calculateDelta(contactRate7, contactRatePrev),
      icon: Inbox01,
    },
    {
      label: "Today's leads",
      value: today.toLocaleString(),
      delta: calculateDelta(today, yesterday),
      icon: CheckCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-secondary bg-secondary p-5 shadow-xs transition-all hover:-translate-y-px hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-tertiary">{c.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                {c.value}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-utility-brand-50 text-utility-brand-600 ring-1 ring-inset ring-utility-brand-200">
              <c.icon className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                c.delta.tone === "up"
                  ? "bg-utility-green-50 text-utility-green-700 ring-utility-green-100"
                  : c.delta.tone === "down"
                    ? "bg-utility-red-50 text-utility-red-700 ring-utility-red-100"
                    : "bg-utility-neutral-50 text-utility-neutral-600 ring-utility-neutral-200"
              }`}
            >
              {c.delta.tone === "up" && (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
              {c.delta.tone === "down" && (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {c.delta.value}
            </span>
            <span className="text-xs text-tertiary">
              {c.label === "Total leads" ? "this week" : c.label === "Today's leads" ? "vs yesterday" : "vs prev week"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
