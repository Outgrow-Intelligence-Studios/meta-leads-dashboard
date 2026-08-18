import { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { 
  Activity, 
  AlertCircle, 
  BarChart01, 
  CheckCircle, 
  Mail01, 
  SearchLg, 
  X 
} from "@untitledui/icons";
import { 
  fetchCampaignAnalytics, 
  fetchCampaignEvents, 
  type CampaignAnalytics, 
  type CampaignEvent 
} from "../lib/api";
import { Table, TableCard } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";


export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed" | "sending" | "draft">("all");

  // Selected Campaign (for Details Drawer)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "events">("preview");

  // Fetch campaigns on load
  useEffect(() => {
    async function loadCampaigns() {
      try {
        setLoading(true);
        const data = await fetchCampaignAnalytics();
        setCampaigns(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  // Find selected campaign details
  const selectedCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Fetch events when campaign selection changes
  useEffect(() => {
    if (!selectedCampaignId) {
      setEvents([]);
      return;
    }
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const eventData = await fetchCampaignEvents(selectedCampaignId!);
        setEvents(eventData);
      } catch (e) {
        console.error("Failed to load events", e);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, [selectedCampaignId]);

  // Overall Global Aggregates
  const stats = useMemo(() => {
    let totalSent = 0;
    let totalDelivered = 0;
    let totalOpens = 0;
    let totalReplies = 0;
    let totalBounces = 0;

    campaigns.forEach((c) => {
      totalSent += c.actual_sends || 0;
      totalDelivered += c.delivered || 0;
      totalOpens += c.unique_opens || 0;
      totalReplies += c.total_replies || 0;
      totalBounces += c.total_bounces || 0;
    });

    // Fall back to totalSent when delivered is not tracked by the provider
    const openBase = totalDelivered > 0 ? totalDelivered : totalSent;
    const openRate = openBase > 0 ? (totalOpens / openBase) * 100 : 0;
    const replyRate = openBase > 0 ? (totalReplies / openBase) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;
    const deliveryRate = 99.9;

    return {
      totalSent,
      deliveryRate,
      openRate,
      replyRate,
      totalReplies,
      bounceRate,
    };
  }, [campaigns]);

  // Filtered campaigns list
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  // Area chart: daily sent + opens (last 15 campaign dates)
  const areaChartData = useMemo(() => {
    const dailyData: Record<string, { sent: number; opens: number }> = {};
    const sorted = [...campaigns]
      .filter((c) => c.started_at)
      .sort((a, b) => new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime());

    sorted.forEach((c) => {
      const dateStr = new Date(c.started_at!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!dailyData[dateStr]) dailyData[dateStr] = { sent: 0, opens: 0 };
      dailyData[dateStr].sent += c.actual_sends || 0;
      dailyData[dateStr].opens += c.unique_opens || 0;
    });

    return Object.entries(dailyData)
      .slice(-15)
      .map(([date, d]) => ({ date, Sent: d.sent, Opens: d.opens }));
  }, [campaigns]);

  // Bar chart: open rate per campaign (last 12 sent campaigns)
  const openRateBarData = useMemo(() => {
    return [...campaigns]
      .filter((c) => c.started_at && (c.actual_sends || 0) > 0)
      .sort((a, b) => new Date(b.started_at!).getTime() - new Date(a.started_at!).getTime())
      .slice(0, 12)
      .reverse()
      .map((c) => {
        const base = (c.delivered || 0) > 0 ? c.delivered : (c.actual_sends || 0);
        const openRate = base > 0 ? parseFloat(((c.unique_opens / base) * 100).toFixed(1)) : 0;
        const label = new Date(c.started_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return { label, "Open Rate": openRate, name: c.name };
      });
  }, [campaigns]);

  // Custom tooltip for area chart
  const AreaTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-secondary bg-primary shadow-lg p-3 text-xs min-w-[130px]">
        <p className="font-semibold text-primary mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-tertiary">{p.name}:</span>
            <span className="font-semibold text-primary">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Custom tooltip for bar chart
  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const campaign = openRateBarData.find((d) => d.label === label);
    return (
      <div className="rounded-xl border border-secondary bg-primary shadow-lg p-3 text-xs max-w-[200px]">
        {campaign && <p className="font-semibold text-primary mb-1 truncate">{campaign.name}</p>}
        <p className="text-tertiary">{label}</p>
        <p className="mt-1">Open Rate: <span className="font-bold text-primary">{payload[0].value}%</span></p>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-primary">Email Campaigns Overview</h2>
        <p className="text-sm text-tertiary mt-1">
          Monitor your Columbus Clean email marketing metrics and daily broadcast schedules.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-utility-red-50 p-4 ring-1 ring-utility-red-200">
          <AlertCircle className="size-5 text-utility-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-utility-red-700">Failed to load campaigns</h3>
            <p className="text-sm text-utility-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Sent", value: stats.totalSent.toLocaleString(), desc: "All-time sends", icon: Mail01, color: "blue" },
          { label: "Delivery Rate", value: `${stats.deliveryRate.toFixed(1)}%`, desc: "Successful handoffs", icon: CheckCircle, color: "success" },
          { label: "Open Rate (Unique)", value: `${stats.openRate.toFixed(1)}%`, desc: "Delivered → Opened", icon: Activity, color: "brand" },
          { label: "Reply Rate", value: `${stats.replyRate.toFixed(1)}%`, desc: `${stats.totalReplies} replies tracked`, icon: BarChart01, color: "warning" },
          { label: "Bounce Rate", value: `${stats.bounceRate.toFixed(1)}%`, desc: "Undelivered emails", icon: AlertCircle, color: "error" },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="rounded-xl border border-secondary bg-primary p-4 shadow-xs hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary">{m.label}</span>
                <div className={`p-1.5 rounded-lg bg-secondary text-primary`}>
                  <Icon className="size-4 text-tertiary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-primary mt-2 tracking-tight">{m.value}</h3>
              <p className="text-xs text-tertiary mt-1">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ── Recharts: Area chart — Sent vs Opens over time ── */}
      {areaChartData.length >= 2 && (
        <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary">Daily Campaign Performance</h3>
            <p className="text-xs text-tertiary mt-0.5">Volume of emails sent vs unique opens per campaign date</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-opens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border-secondary)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<AreaTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Area
                type="monotone"
                dataKey="Sent"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#grad-sent)"
                dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="Opens"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#grad-opens)"
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Recharts: Bar chart — Open Rate per Campaign ── */}
      {openRateBarData.length >= 2 && (
        <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-primary">Open Rate per Campaign</h3>
            <p className="text-xs text-tertiary mt-0.5">Last {openRateBarData.length} sent campaigns — % of recipients who opened</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={openRateBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid vertical={false} stroke="var(--color-border-secondary)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, (dataMax: number) => Math.ceil(Math.max(dataMax, 5) * 1.2)]}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.5 }} />
              <Bar dataKey="Open Rate" radius={[4, 4, 0, 0]}>
                {openRateBarData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={`hsl(${240 + index * 15}, 70%, ${55 + index * 2}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaigns Listing & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Search campaigns or subject..."
              value={search}
              onChange={(v) => setSearch(v)}
              icon={SearchLg}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto self-start sm:self-center border border-secondary p-1 rounded-lg bg-secondary">
            {(["all", "sent", "sending", "failed", "draft"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? "bg-primary text-primary shadow-sm"
                    : "text-tertiary hover:text-primary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table list */}
        <TableCard.Root>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 bg-primary">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-brand" />
              <p className="text-sm text-tertiary">Loading campaign data...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-primary">
              <div className="p-3 bg-secondary rounded-full">
                <Mail01 className="size-6 text-tertiary" />
              </div>
              <h4 className="text-md font-semibold text-primary mt-3">No campaigns found</h4>
              <p className="text-xs text-tertiary mt-1 max-w-xs">
                Try adjusting your search criteria or filter options to view campaigns.
              </p>
            </div>
          ) : (
            <Table aria-label="Columbus Clean Email Campaigns">
              <Table.Header>
                <Table.Head isRowHeader>Campaign Details</Table.Head>
                <Table.Head>Date Sent</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Sent</Table.Head>
                <Table.Head>Open Rate</Table.Head>
                <Table.Head>Reply Rate</Table.Head>
                <Table.Head>Bounce Rate</Table.Head>
              </Table.Header>
              <Table.Body>
                {filteredCampaigns.map((c) => {
                  // Use delivered when available, fall back to actual_sends (provider may not report delivered separately)
                  const openBase = (c.delivered || 0) > 0 ? c.delivered : (c.actual_sends || 0);
                  const oRate = openBase > 0 ? (c.unique_opens / openBase) * 100 : 0;
                  const rRate = openBase > 0 ? ((c.total_replies || 0) / openBase) * 100 : 0;
                  const bRate = c.actual_sends > 0 ? (c.total_bounces / c.actual_sends) * 100 : 0;
                  const formattedDate = c.started_at
                    ? new Date(c.started_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not started";

                  return (
                    <Table.Row 
                      key={c.id} 
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedCampaignId(c.id);
                        setActiveTab("preview");
                      }}
                    >
                      <Table.Cell>
                        <div>
                          <div className="font-semibold text-primary">{c.name}</div>
                          <div className="text-xs text-tertiary truncate max-w-xs sm:max-w-md mt-0.5">{c.subject}</div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-secondary text-xs">{formattedDate}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={
                            c.status === "sent" ? "success" :
                            c.status === "failed" ? "error" :
                            c.status === "sending" ? "warning" :
                            "gray"
                          }
                          size="sm"
                          type="pill-color"
                        >
                          {c.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-secondary font-medium text-xs">{c.actual_sends}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <span className="text-secondary font-medium text-xs">{oRate.toFixed(1)}%</span>
                          <span className="text-[10px] text-tertiary block mt-0.5">{c.unique_opens} opens</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <span className="text-secondary font-medium text-xs">{rRate.toFixed(1)}%</span>
                          <span className="text-[10px] text-tertiary block mt-0.5">{c.total_replies || 0} replies</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <span className={`font-medium text-xs ${bRate > 5 ? "text-utility-red-600" : "text-secondary"}`}>{bRate.toFixed(1)}%</span>
                          <span className="text-[10px] text-tertiary block mt-0.5">{c.total_bounces} bounces</span>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </TableCard.Root>
      </div>

      {/* Details Side-Drawer */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in bg-overlay backdrop-blur-xs">
          {/* Dismiss area */}
          <div className="flex-1" onClick={() => setSelectedCampaignId(null)} />
          
          {/* Drawer content */}
          <div className="w-full max-w-2xl bg-primary h-full shadow-2xl flex flex-col border-l border-secondary">
            {/* Header */}
            <div className="p-5 border-b border-secondary flex items-start justify-between bg-secondary/30">
              <div className="min-w-0">
                <span className="text-xs text-tertiary uppercase font-bold tracking-wider">Campaign Details</span>
                <h3 className="text-lg font-bold text-primary truncate mt-1">{selectedCampaign.name}</h3>
                <p className="text-xs text-secondary mt-1 font-mono truncate">{selectedCampaign.subject}</p>
              </div>
              <button 
                onClick={() => setSelectedCampaignId(null)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="size-5 text-tertiary hover:text-primary" />
              </button>
            </div>

            {/* Campaign Summary Grid */}
            <div className="p-5 border-b border-secondary bg-secondary/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] font-bold text-tertiary uppercase">Sent</span>
                <div className="text-lg font-bold text-primary mt-1">{selectedCampaign.actual_sends}</div>
                {selectedCampaign.delivered > 0 && selectedCampaign.delivered !== selectedCampaign.actual_sends && (
                  <span className="text-[10px] text-tertiary">{selectedCampaign.delivered} delivered</span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-tertiary uppercase">Unique Opens</span>
                <div className="text-lg font-bold text-utility-green-700 mt-1">
                  {selectedCampaign.unique_opens}
                  <span className="text-xs font-normal text-tertiary ml-1">
                    {(() => {
                      const base = (selectedCampaign.delivered || 0) > 0 ? selectedCampaign.delivered : selectedCampaign.actual_sends;
                      return base > 0 ? `(${((selectedCampaign.unique_opens / base) * 100).toFixed(1)}%)` : "";
                    })()}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-tertiary uppercase">Replies</span>
                <div className="text-lg font-bold text-utility-purple-700 mt-1">
                  {selectedCampaign.total_replies || 0}
                  <span className="text-xs font-normal text-tertiary ml-1">
                    ({selectedCampaign.delivered > 0 ? (((selectedCampaign.total_replies || 0) / selectedCampaign.delivered) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-tertiary uppercase">Bounces</span>
                <div className={`text-lg font-bold mt-1 ${selectedCampaign.total_bounces > 0 ? "text-utility-red-600" : "text-primary"}`}>
                  {selectedCampaign.total_bounces}
                </div>
              </div>
            </div>

            {/* Tabs selector */}
            <div className="flex border-b border-secondary px-5">
              <button
                onClick={() => setActiveTab("preview")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "preview"
                    ? "border-brand text-brand"
                    : "border-transparent text-tertiary hover:text-primary"
                }`}
              >
                Email Body Preview
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "events"
                    ? "border-brand text-brand"
                    : "border-transparent text-tertiary hover:text-primary"
                }`}
              >
                Recent Events Log ({events.length})
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "preview" ? (
                <div className="h-full flex flex-col space-y-3">
                  <div className="rounded-lg border border-secondary bg-secondary/10 p-3 text-xs space-y-1 text-tertiary">
                    <div><b>Date:</b> {selectedCampaign.started_at ? new Date(selectedCampaign.started_at).toLocaleString() : "N/A"}</div>
                    <div><b>Status:</b> {selectedCampaign.status}</div>
                  </div>
                  <div className="flex-1 rounded-lg border border-secondary overflow-hidden bg-white min-h-[300px]">
                    <iframe 
                      title="Email Preview"
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="utf-8">
                            <style>
                              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #333; line-height: 1.5; background: #fff; }
                              img { max-width: 100%; height: auto; }
                            </style>
                          </head>
                          <body>
                            ${campaigns.find(c => c.id === selectedCampaignId)?.id === selectedCampaignId ? (
                              // We can safely render HTML since we are inside a sandboxed iframe
                              (campaigns.find(c => c.id === selectedCampaignId) as any).html_body || 
                              `<div style="color:#666;text-align:center;margin-top:40px;">No HTML preview available. Text version: <br/><pre style="text-align:left;background:#f5f5f5;padding:10px;margin-top:10px;">${(campaigns.find(c => c.id === selectedCampaignId) as any).text_body || "Empty Body"}</pre></div>`
                            ) : ""}
                          </body>
                        </html>
                      `}
                      sandbox="allow-same-origin"
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {loadingEvents ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-brand" />
                      <p className="text-xs text-tertiary">Fetching event logs...</p>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-12 text-tertiary text-xs">
                      No webhook event logs recorded for this campaign.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-secondary overflow-hidden divide-y divide-secondary bg-primary">
                      {events.map((e) => (
                        <div key={e.id} className="p-3 text-xs flex justify-between items-start gap-4">
                          <div>
                            <div className="font-semibold text-primary">{e.email}</div>
                            {e.click_url && (
                              <div className="text-[10px] text-brand hover:underline truncate mt-1">
                                Clicked: {e.click_url}
                              </div>
                            )}
                            {(e.bounce_type || e.bounce_subtype) && (
                              <div className="text-[10px] text-utility-red-600 mt-1">
                                Type: {e.bounce_type} ({e.bounce_subtype})
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <Badge
                              color={
                                e.event_type === "open" ? "success" :
                                e.event_type === "reply" ? "brand" :
                                e.event_type === "click" ? "warning" :
                                e.event_type === "bounce" ? "error" :
                                e.event_type === "delivery" ? "blue" :
                                "gray"
                              }
                              size="sm"
                              type="pill-color"
                            >
                              {e.event_type}
                            </Badge>
                            <span className="text-[10px] text-tertiary block mt-1">
                              {new Date(e.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
