const campaigns = [
  { name: 'Summer Sale — IG Reels', spend: '$1,240', leads: 18, status: 'Active', cpl: '$68.89' },
  { name: 'Lead Gen — FB Form', spend: '$890', leads: 12, status: 'Active', cpl: '$74.17' },
  { name: 'Retarget — Messenger', spend: '$520', leads: 7, status: 'Paused', cpl: '$74.29' },
  { name: 'Brand Awareness — Stories', spend: '$1,100', leads: 9, status: 'Active', cpl: '$122.22' },
  { name: 'WhatsApp Click — Promotion', spend: '$670', leads: 5, status: 'Ended', cpl: '$134.00' },
]

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Campaigns</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Your Meta Ads campaigns and their performance.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-4 py-3">Spend</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">CPL</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3.5 text-slate-700">{c.spend}</td>
                  <td className="px-4 py-3.5 text-slate-700">{c.leads}</td>
                  <td className="px-4 py-3.5 text-slate-700">{c.cpl}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                        c.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          : c.status === 'Paused'
                            ? 'bg-amber-50 text-amber-700 ring-amber-100'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
