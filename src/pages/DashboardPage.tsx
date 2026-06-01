import StatsCards from '../components/StatsCards'
import type { Lead } from '../lib/api'

export default function DashboardPage({ leads }: { leads: Lead[] }) {
  const recentLeads = leads.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Dashboard Overview</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Weekly performance summary for your Meta ad campaigns.
        </p>
      </div>

      <StatsCards leads={leads} />

      {recentLeads.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Leads</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-xs font-semibold ${
                    ['from-indigo-500 to-violet-600', 'from-rose-500 to-pink-600', 'from-emerald-500 to-teal-600'][
                      Math.abs(lead.name.charCodeAt(0) || 0) % 3
                    ]
                  }`}
                >
                  {lead.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 truncate">{lead.name}</div>
                  <div className="text-xs text-slate-500 truncate">{lead.source}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                    lead.status === 'New'
                      ? 'bg-blue-50 text-blue-700 ring-blue-100'
                      : lead.status === 'Hot'
                        ? 'bg-rose-50 text-rose-700 ring-rose-100'
                        : lead.status === 'Contacted'
                          ? 'bg-amber-50 text-amber-700 ring-amber-100'
                          : lead.status === 'Won'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                  }`}
                >
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
