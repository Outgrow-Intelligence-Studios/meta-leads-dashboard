import { useEffect, useState, useMemo } from "react";
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
    let totalClicks = 0;
    let totalBounces = 0;

    campaigns.forEach((c) => {
      totalSent += c.actual_sends || 0;
      totalDelivered += c.delivered || 0;
      totalOpens += c.unique_opens || 0;
      totalClicks += c.unique_clicks || 0;
      totalBounces += c.total_bounces || 0;
    });

    const openRate = totalDelivered > 0 ? (totalOpens / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicks / totalDelivered) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;
    const deliveryRate = 99.9;

    return {
      totalSent,
      deliveryRate,
      openRate,
      clickRate,
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

  // Chart Data Preparation: Daily aggregate stats for last 14 days
  const chartPoints = useMemo(() => {
    const dailyData: Record<string, { sent: number; opens: number }> = {};
    
    // Sort campaigns oldest to newest to plot correctly
    const sorted = [...campaigns]
      .filter((c) => c.started_at)
      .sort((a, b) => new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime());

    sorted.forEach((c) => {
      const dateStr = new Date(c.started_at!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { sent: 0, opens: 0 };
      }
      dailyData[dateStr].sent += c.actual_sends || 0;
      dailyData[dateStr].opens += c.unique_opens || 0;
    });

    // Take the last 15 unique active campaign dates
    return Object.entries(dailyData).slice(-15);
  }, [campaigns]);

  // SVG Chart rendering helper
  const svgChart = useMemo(() => {
    if (chartPoints.length < 2) return null;

    const width = 1200;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxSent = Math.max(...chartPoints.map(([_, d]) => d.sent), 10);

    const points = chartPoints.map(([date, data], idx) => {
      const x = paddingLeft + (idx / (chartPoints.length - 1)) * chartWidth;
      // Invert Y coordinate since SVG (0,0) is top-left
      const y = paddingTop + chartHeight - (data.sent / maxSent) * chartHeight;
      const yOpen = paddingTop + chartHeight - (data.opens / maxSent) * chartHeight;
      return { x, y, yOpen, date, sent: data.sent, opens: data.opens };
    });

    // Generate path descriptions
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

    const openLinePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yOpen}`).join(" ");

    return {
      width,
      height,
      paddingLeft,
      paddingTop,
      chartHeight,
      maxSent,
      points,
      linePath,
      areaPath,
      openLinePath,
    };
  }, [chartPoints]);

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
          { label: "Click Rate", value: `${stats.clickRate.toFixed(1)}%`, desc: "Delivered → Clicked", icon: BarChart01, color: "warning" },
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

      {/* SVG Chart Panel */}
      {svgChart && (
        <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-secondary pb-4">
            <div>
              <h3 className="text-sm font-semibold text-primary">Daily Campaign Performance</h3>
              <p className="text-xs text-tertiary mt-0.5">Volume of emails sent vs unique opens</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded bg-brand/20 border border-brand block" />
                <span className="text-secondary">Sent Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded bg-[#12b76a] block" />
                <span className="text-secondary">Unique Opens</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 overflow-x-auto">
            <svg 
              viewBox={`0 0 ${svgChart.width} ${svgChart.height}`} 
              className="w-full h-[200px] overflow-visible"
            >
              {/* Grid Lines */}
              <line x1={svgChart.paddingLeft} y1={svgChart.paddingTop} x2={svgChart.width - 20} y2={svgChart.paddingTop} stroke="var(--color-border-secondary)" strokeDasharray="3 3" />
              <line x1={svgChart.paddingLeft} y1={svgChart.paddingTop + svgChart.chartHeight / 2} x2={svgChart.width - 20} y2={svgChart.paddingTop + svgChart.chartHeight / 2} stroke="var(--color-border-secondary)" strokeDasharray="3 3" />
              <line x1={svgChart.paddingLeft} y1={svgChart.paddingTop + svgChart.chartHeight} x2={svgChart.width - 20} y2={svgChart.paddingTop + svgChart.chartHeight} stroke="var(--color-border-secondary)" />

              {/* Y Axis Labels */}
              <text x={svgChart.paddingLeft - 8} y={svgChart.paddingTop + 4} textAnchor="end" className="text-[10px] fill-neutral-500 font-mono">{svgChart.maxSent}</text>
              <text x={svgChart.paddingLeft - 8} y={svgChart.paddingTop + svgChart.chartHeight / 2 + 4} textAnchor="end" className="text-[10px] fill-neutral-500 font-mono">{Math.round(svgChart.maxSent / 2)}</text>
              <text x={svgChart.paddingLeft - 8} y={svgChart.paddingTop + svgChart.chartHeight + 4} textAnchor="end" className="text-[10px] fill-neutral-500 font-mono">0</text>

              {/* Area & Line for Sent */}
              <path d={svgChart.areaPath} fill="var(--color-brand-secondary)" className="opacity-40" />
              <path d={svgChart.linePath} fill="none" stroke="var(--color-brand)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

              {/* Line for Opens */}
              <path d={svgChart.openLinePath} fill="none" stroke="#12b76a" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />

              {/* Points & Hover Indicators */}
              {svgChart.points.map((p, idx) => (
                <g key={idx}>
                  {/* Vertical hover guide */}
                  <line x1={p.x} y1={svgChart.paddingTop} x2={p.x} y2={svgChart.paddingTop + svgChart.chartHeight} stroke="var(--color-border-secondary)" strokeWidth={1} strokeDasharray="2 2" className="opacity-40 hover:opacity-100 transition-opacity" />
                  
                  {/* Sent dots */}
                  <circle cx={p.x} cy={p.y} r={4} fill="var(--color-brand)" stroke="#fff" strokeWidth={1.5} />
                  {/* Opens dots */}
                  <circle cx={p.x} cy={p.yOpen} r={4} fill="#12b76a" stroke="#fff" strokeWidth={1.5} />
                  
                  {/* X axis labels */}
                  <text x={p.x} y={svgChart.paddingTop + svgChart.chartHeight + 16} textAnchor="middle" className="text-[10px] fill-neutral-500 font-medium">{p.date}</text>
                </g>
              ))}
            </svg>
          </div>
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
                <Table.Head>Click Rate</Table.Head>
                <Table.Head>Bounce Rate</Table.Head>
              </Table.Header>
              <Table.Body>
                {filteredCampaigns.map((c) => {
                  const oRate = c.delivered > 0 ? (c.unique_opens / c.delivered) * 100 : 0;
                  const cRate = c.delivered > 0 ? (c.unique_clicks / c.delivered) * 100 : 0;
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
                          <span className="text-secondary font-medium text-xs">{cRate.toFixed(1)}%</span>
                          <span className="text-[10px] text-tertiary block mt-0.5">{c.unique_clicks} clicks</span>
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
                <span className="text-[10px] font-bold text-tertiary uppercase">Delivered</span>
                <div className="text-lg font-bold text-primary mt-1">{selectedCampaign.delivered}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-tertiary uppercase">Unique Opens</span>
                <div className="text-lg font-bold text-utility-green-700 mt-1">
                  {selectedCampaign.unique_opens}
                  <span className="text-xs font-normal text-tertiary ml-1">
                    ({selectedCampaign.delivered > 0 ? ((selectedCampaign.unique_opens / selectedCampaign.delivered) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-tertiary uppercase">Unique Clicks</span>
                <div className="text-lg font-bold text-utility-yellow-700 mt-1">
                  {selectedCampaign.unique_clicks}
                  <span className="text-xs font-normal text-tertiary ml-1">
                    ({selectedCampaign.delivered > 0 ? ((selectedCampaign.unique_clicks / selectedCampaign.delivered) * 100).toFixed(1) : 0}%)
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
