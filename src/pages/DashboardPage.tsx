import { useMemo } from "react";
import type { Lead, CampaignAnalytics } from "../lib/api";
import StatsCards from "../components/StatsCards";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// ─── Color Palette ──────────────────────────────────────────────────────────
const COLORS = {
  meta: "#1877F2",       // Facebook Blue
  google: "#34A853",     // Google Green
  organic: "#8B5CF6",    // Purple
  thisMonth: "#6366f1",  // Indigo
  lastMonth: "#94a3b8",  // Slate
  new: "#3b82f6",
  contacted: "#f59e0b",
  hot: "#ef4444",
  won: "#10b981",
  lost: "#6b7280",
  noAns: "#d1d5db",
};

const PIE_COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-secondary bg-primary shadow-lg p-3 text-xs min-w-[120px]">
      {label && <p className="font-semibold text-primary mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-tertiary">{p.name}:</span>
          <span className="font-semibold text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-secondary bg-primary shadow-lg p-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: d.payload.fill }} />
        <span className="font-semibold text-primary">{d.name}</span>
      </div>
      <p className="text-tertiary mt-1">Count: <span className="text-primary font-semibold">{d.value}</span></p>
      <p className="text-tertiary">Share: <span className="text-primary font-semibold">{d.payload.pct}%</span></p>
    </div>
  );
};

// ─── Chart Card Wrapper ──────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, className = "" }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-secondary bg-primary shadow-xs p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-tertiary mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Donut Chart with center label ──────────────────────────────────────────
function DonutChart({ data, title, subtitle, centerLabel, centerValue }: {
  data: { name: string; value: number; fill: string; pct: string }[];
  title: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string | number;
}) {

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <PieChart width={150} height={150}>
            <Pie
              data={data}
              cx={70}
              cy={70}
              innerRadius={44}
              outerRadius={68}
              paddingAngle={3}
              cornerRadius={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
          {centerValue !== undefined && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-primary">{centerValue}</span>
              {centerLabel && <span className="text-[10px] text-tertiary">{centerLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
              <span className="text-xs text-secondary truncate flex-1">{entry.name}</span>
              <span className="text-xs font-semibold text-primary tabular-nums">{entry.value}</span>
              <span className="text-[10px] text-tertiary tabular-nums w-8 text-right">{entry.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// ─── KPI Compare Card ────────────────────────────────────────────────────────
function KpiCompareCard({ title, thisMonth, lastMonth, unit = "", color = "#6366f1" }: {
  title: string;
  thisMonth: number;
  lastMonth: number;
  unit?: string;
  color?: string;
}) {
  const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;
  const isUp = delta >= 0;
  const sparkData = [{ v: lastMonth }, { v: thisMonth }];

  return (
    <div className="rounded-xl border border-secondary bg-primary shadow-xs p-4 hover:shadow-sm transition-all">
      <p className="text-xs font-semibold text-tertiary">{title}</p>
      <div className="flex items-end justify-between mt-2">
        <div>
          <p className="text-2xl font-bold text-primary tracking-tight">
            {typeof thisMonth === "number" ? thisMonth.toFixed(unit === "%" ? 1 : 0) : thisMonth}{unit}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ring-inset ${
              isUp ? "bg-utility-green-50 text-utility-green-700 ring-utility-green-100" : "bg-utility-red-50 text-utility-red-700 ring-utility-red-100"
            }`}>
              {isUp ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
            </span>
            <span className="text-[10px] text-tertiary">vs last month</span>
          </div>
        </div>
        <div className="w-16 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id={`spark-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${title.replace(/\s/g, "")})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-[10px] text-tertiary mt-1">Last month: {typeof lastMonth === "number" ? lastMonth.toFixed(unit === "%" ? 1 : 0) : lastMonth}{unit}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DashboardPage({
  leads,
  campaigns = [],
}: {
  leads: Lead[];
  campaigns?: CampaignAnalytics[];
}) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // ── Month-tagged helpers ────────────────────────────────────────────────
  const thisMonthLeads = useMemo(
    () => leads.filter((l) => new Date(l.created_at) >= thisMonthStart),
    [leads]
  );
  const lastMonthLeads = useMemo(
    () => leads.filter((l) => {
      const t = new Date(l.created_at);
      return t >= lastMonthStart && t <= lastMonthEnd;
    }),
    [leads]
  );

  // ── Ad Source data ──────────────────────────────────────────────────────
  const adSourceData = useMemo(() => {
    const meta = leads.filter((l) => l.ad_source === "Meta Ads").length;
    const google = leads.filter((l) => l.ad_source === "Google Ads").length;
    const organic = leads.filter((l) => !l.ad_source || l.ad_source === "Organic" || l.ad_source === "").length;
    const total = meta + google + organic || 1;
    return [
      { name: "Meta Ads", value: meta, fill: COLORS.meta, pct: ((meta / total) * 100).toFixed(1) },
      { name: "Google Ads", value: google, fill: COLORS.google, pct: ((google / total) * 100).toFixed(1) },
      { name: "Organic / Direct", value: organic, fill: COLORS.organic, pct: ((organic / total) * 100).toFixed(1) },
    ];
  }, [leads]);

  // ── Meta vs Google per month (last 6 months) ────────────────────────────
  const adsMonthlyData = useMemo(() => {
    const months: { label: string; Meta: number; Google: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const inMonth = leads.filter((l) => {
        const t = new Date(l.created_at);
        return t >= mStart && t <= mEnd;
      });
      months.push({
        label,
        Meta: inMonth.filter((l) => l.ad_source === "Meta Ads").length,
        Google: inMonth.filter((l) => l.ad_source === "Google Ads").length,
      });
    }
    return months;
  }, [leads]);

  // ── Email campaigns: this month vs last month ───────────────────────────
  const emailTrendData = useMemo(() => {
    const thisMonthCamps = campaigns.filter(
      (c) => c.started_at && new Date(c.started_at) >= thisMonthStart
    );
    const lastMonthCamps = campaigns.filter((c) => {
      if (!c.started_at) return false;
      const t = new Date(c.started_at);
      return t >= lastMonthStart && t <= lastMonthEnd;
    });

    // Build cumulative day-by-day data for both months (indexed by day of month 1-31)
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    // For each day in the month, accumulate total sends
    const thisMap: Record<number, number> = {};
    const lastMap: Record<number, number> = {};

    thisMonthCamps.forEach((c) => {
      const day = new Date(c.started_at!).getDate();
      thisMap[day] = (thisMap[day] || 0) + (c.actual_sends || 0);
    });
    lastMonthCamps.forEach((c) => {
      const day = new Date(c.started_at!).getDate();
      lastMap[day] = (lastMap[day] || 0) + (c.actual_sends || 0);
    });

    const todayDay = now.getDate();
    return days
      .filter((d) => d <= 31)
      .map((d) => ({
        day: `D${d}`,
        "This Month": d <= todayDay ? (thisMap[d] || 0) : null,
        "Last Month": lastMap[d] || 0,
      }))
      .filter((_, i) => i < 28); // show up to 28 days
  }, [campaigns]);

  // ── Email MoM summary metrics ───────────────────────────────────────────
  const emailMetrics = useMemo(() => {
    const thisCamps = campaigns.filter(
      (c) => c.started_at && new Date(c.started_at) >= thisMonthStart
    );
    const lastCamps = campaigns.filter((c) => {
      if (!c.started_at) return false;
      const t = new Date(c.started_at);
      return t >= lastMonthStart && t <= lastMonthEnd;
    });

    const totalSent = (arr: CampaignAnalytics[]) =>
      arr.reduce((s, c) => s + (c.actual_sends || 0), 0);
    const totalOpens = (arr: CampaignAnalytics[]) =>
      arr.reduce((s, c) => s + (c.unique_opens || 0), 0);

    const thisSent = totalSent(thisCamps);
    const lastSent = totalSent(lastCamps);
    const thisOpenRate = thisSent > 0 ? (totalOpens(thisCamps) / thisSent) * 100 : 0;
    const lastOpenRate = lastSent > 0 ? (totalOpens(lastCamps) / lastSent) * 100 : 0;

    return { thisSent, lastSent, thisOpenRate, lastOpenRate };
  }, [campaigns]);

  // ── Lead Status distribution ────────────────────────────────────────────
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    const total = leads.length || 1;
    const statusColors: Record<string, string> = {
      New: COLORS.new, Contacted: COLORS.contacted, Hot: COLORS.hot,
      Won: COLORS.won, Lost: COLORS.lost, "No Ans": COLORS.noAns,
    };
    return Object.entries(counts).map(([name, value], i) => ({
      name, value,
      fill: statusColors[name] || PIE_COLORS[i % PIE_COLORS.length],
      pct: ((value / total) * 100).toFixed(1),
    })).sort((a, b) => b.value - a.value);
  }, [leads]);

  // ── Owner (sales person) distribution ──────────────────────────────────
  const ownerData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const owner = l.sales_person?.trim() || "Unassigned";
      counts[owner] = (counts[owner] || 0) + 1;
    });
    const total = leads.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name, value,
        fill: PIE_COLORS[i % PIE_COLORS.length],
        pct: ((value / total) * 100).toFixed(1),
      }));
  }, [leads]);

  // ── Region distribution ─────────────────────────────────────────────────
  const regionData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const region = l.location?.trim() || "Unknown";
      counts[region] = (counts[region] || 0) + 1;
    });
    const total = leads.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name, value,
        fill: PIE_COLORS[i % PIE_COLORS.length],
        pct: ((value / total) * 100).toFixed(1),
      }));
  }, [leads]);

  // ── This month vs last month leads (Meta / Google) ──────────────────────
  const metaThisMonth = thisMonthLeads.filter((l) => l.ad_source === "Meta Ads").length;
  const metaLastMonth = lastMonthLeads.filter((l) => l.ad_source === "Meta Ads").length;
  const googleThisMonth = thisMonthLeads.filter((l) => l.ad_source === "Google Ads").length;
  const googleLastMonth = lastMonthLeads.filter((l) => l.ad_source === "Google Ads").length;

  const hasEmailData = emailTrendData.some((d) => (d["This Month"] ?? 0) > 0 || d["Last Month"] > 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-primary">Dashboard Overview</h2>
        <p className="text-sm text-tertiary mt-1">
          Performance summary — leads, ads attribution, and email campaigns.
        </p>
      </div>

      {/* KPI Strip */}
      <StatsCards leads={leads} />

      {/* ── Row 1: Ads MoM KPIs + Email MoM KPIs ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCompareCard
          title="Meta Ads Leads"
          thisMonth={metaThisMonth}
          lastMonth={metaLastMonth}
          color={COLORS.meta}
        />
        <KpiCompareCard
          title="Google Ads Leads"
          thisMonth={googleThisMonth}
          lastMonth={googleLastMonth}
          color={COLORS.google}
        />
        <KpiCompareCard
          title="Email Campaigns Sent"
          thisMonth={emailMetrics.thisSent}
          lastMonth={emailMetrics.lastSent}
          color={COLORS.thisMonth}
        />
        <KpiCompareCard
          title="Email Open Rate"
          thisMonth={emailMetrics.thisOpenRate}
          lastMonth={emailMetrics.lastOpenRate}
          unit="%"
          color="#f59e0b"
        />
      </div>

      {/* ── Row 2: Meta vs Google Bar + Ad Source Donut ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Stacked Bar: Meta vs Google per month */}
        <ChartCard
          className="lg:col-span-3"
          title="Meta Ads vs Google Ads — Monthly Leads"
          subtitle="Last 6 months comparison"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={adsMonthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
              <CartesianGrid vertical={false} stroke="var(--color-border-secondary)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.5 }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              />
              <Bar dataKey="Meta" fill={COLORS.meta} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Google" fill={COLORS.google} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut: Ad Source split */}
        <div className="lg:col-span-2">
          <DonutChart
            title="Ad Source Distribution"
            subtitle="All-time lead attribution"
            data={adSourceData}
            centerLabel="Leads"
            centerValue={leads.length}
          />
        </div>
      </div>

      {/* ── Row 3: Email Campaign Trend ───────────────────────────────── */}
      {hasEmailData && (
        <ChartCard
          title="Email Campaign Volume — This Month vs Last Month"
          subtitle="Cumulative daily emails sent per campaign batch"
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={emailTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-this" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.thisMonth} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.thisMonth} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-last" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.lastMonth} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS.lastMonth} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border-secondary)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "var(--color-text-tertiary)" }}
                axisLine={false} tickLine={false}
                interval={6}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="Last Month"
                stroke={COLORS.lastMonth}
                strokeWidth={1.5}
                fill="url(#grad-last)"
                dot={false}
                strokeDasharray="4 2"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="This Month"
                stroke={COLORS.thisMonth}
                strokeWidth={2}
                fill="url(#grad-this)"
                dot={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Row 4: KPI Distribution Grid ──────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">KPI Distributions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Lead Status */}
          <DonutChart
            title="Lead Status"
            subtitle="All-time breakdown"
            data={statusData}
            centerLabel="total"
            centerValue={leads.length}
          />

          {/* Owner Distribution */}
          <DonutChart
            title="Lead Owner"
            subtitle="Assignments by sales person"
            data={ownerData}
            centerLabel="owners"
            centerValue={ownerData.length}
          />

          {/* Region Distribution */}
          <DonutChart
            title="Region / Location"
            subtitle="Top 6 regions"
            data={regionData}
            centerLabel="regions"
            centerValue={regionData.length}
          />

          {/* Email Open Rate MoM – bar comparison */}
          <ChartCard title="Email Open Rate" subtitle="This month vs last month">
            {campaigns.length === 0 ? (
              <div className="flex items-center justify-center h-[150px] text-xs text-tertiary">No campaign data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart
                    data={[
                      { month: "Last", rate: parseFloat(emailMetrics.lastOpenRate.toFixed(1)) },
                      { month: "This", rate: parseFloat(emailMetrics.thisOpenRate.toFixed(1)) },
                    ]}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    barSize={32}
                  >
                    <CartesianGrid vertical={false} stroke="var(--color-border-secondary)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Open Rate"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      <Cell fill={COLORS.lastMonth} />
                      <Cell fill="#f59e0b" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-between mt-2 text-xs">
                  <div>
                    <span className="text-tertiary">Last month </span>
                    <span className="font-semibold text-primary">{emailMetrics.lastOpenRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-tertiary">This month </span>
                    <span className="font-semibold text-primary">{emailMetrics.thisOpenRate.toFixed(1)}%</span>
                  </div>
                </div>
              </>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
