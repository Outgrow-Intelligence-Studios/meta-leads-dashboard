import type { Lead } from "../lib/api";

export default function AnalyticsPage({ leads }: { leads: Lead[] }) {
  const total = leads.length;
  const contacted = leads.filter((l) => l.status === "Contacted").length;
  const hot = leads.filter((l) => l.status === "Hot").length;
  const won = leads.filter((l) => l.status === "Won").length;
  const lost = leads.filter((l) => l.status === "Lost").length;

  const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
  const contactRate = total > 0 ? (((contacted + hot) / total) * 100).toFixed(1) : "0.0";

  const metrics = [
    { label: "Conversion Rate", value: `${conversionRate}%`, sub: `${won} won out of ${total}` },
    { label: "Contact Rate", value: `${contactRate}%`, sub: `${contacted + hot} engaged out of ${total}` },
    { label: "Hot Lead Ratio", value: total > 0 ? `${((hot / total) * 100).toFixed(1)}%` : "0%", sub: `${hot} hot leads` },
    { label: "Win / Loss Ratio", value: lost > 0 ? `${(won / lost).toFixed(1)}x` : "\u2014", sub: `${won} won, ${lost} lost` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">Analytics</h2>
        <p className="text-sm text-tertiary mt-0.5">
          Key metrics and conversion insights for your lead pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-secondary bg-primary p-5 shadow-xs"
          >
            <div className="text-sm text-tertiary">{m.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-primary">
              {m.value}
            </div>
            <div className="mt-1 text-xs text-tertiary">{m.sub}</div>
          </div>
        ))}
      </div>

      {leads.length > 0 && (
        <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-primary mb-3">Lead Funnel</h3>
          <div className="space-y-2">
            {[
              { label: "Total Leads", count: total, color: "bg-utility-neutral-200" },
              { label: "Contacted", count: contacted + hot, color: "bg-utility-yellow-400" },
              { label: "Hot", count: hot, color: "bg-utility-red-400" },
              { label: "Won", count: won, color: "bg-utility-green-500" },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-tertiary text-right">{stage.label}</div>
                <div className="flex-1">
                  <div className="h-6 rounded-md bg-utility-neutral-100 overflow-hidden">
                    <div
                      className={`h-full rounded-md ${stage.color} transition-all`}
                      style={{ width: `${(stage.count / total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-xs font-medium text-secondary tabular-nums">{stage.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
