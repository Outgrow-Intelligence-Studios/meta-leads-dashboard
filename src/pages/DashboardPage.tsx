import StatsCards from "../components/StatsCards";
import type { Lead } from "../lib/api";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";

export default function DashboardPage({ leads }: { leads: Lead[] }) {
  const recentLeads = leads.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">Dashboard Overview</h2>
        <p className="text-sm text-tertiary mt-0.5">
          Weekly performance summary for your Meta ad campaigns.
        </p>
      </div>

      <StatsCards leads={leads} />

      {recentLeads.length > 0 && (
        <div className="rounded-xl border border-secondary bg-primary shadow-xs">
          <div className="px-5 py-4 border-b border-secondary">
            <h3 className="text-sm font-semibold text-primary">Recent Leads</h3>
          </div>
          <div className="divide-y divide-secondary">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar
                  size="sm"
                  initials={(lead.name || "?")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-primary truncate">{lead.name}</div>
                  <div className="text-xs text-tertiary truncate">{lead.source}</div>
                </div>
                <Badge
                  color={
                    lead.status === "New" ? "blue" :
                    lead.status === "Hot" ? "error" :
                    lead.status === "Contacted" ? "warning" :
                    lead.status === "Won" ? "success" :
                    "gray"
                  }
                  size="sm"
                  type="pill-color"
                >
                  {lead.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
