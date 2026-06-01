import type { Lead } from '../lib/api'

function calculateDelta(current: number, previous: number): { value: string; tone: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return { value: current > 0 ? '+\u221E%' : '0%', tone: current > 0 ? 'up' : 'neutral' }
  }
  const change = ((current - previous) / previous) * 100
  const abs = Math.abs(change)
  if (change > 0) return { value: `+${abs.toFixed(1)}%`, tone: 'up' }
  if (change < 0) return { value: `-${abs.toFixed(1)}%`, tone: 'down' }
  return { value: '0%', tone: 'neutral' }
}

export default function StatsCards({ leads }: { leads: Lead[] }) {
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  const sevenDaysAgo = now - 7 * DAY
  const fourteenDaysAgo = now - 14 * DAY

  const last7 = leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo)
  const prev7 = leads.filter(
    (l) => {
      const t = new Date(l.created_at).getTime()
      return t < sevenDaysAgo && t >= fourteenDaysAgo
    }
  )

  const last7Count = last7.length
  const prev7Count = prev7.length
  const last7Hot = last7.filter((l) => l.status === 'Hot').length
  const prev7Hot = prev7.filter((l) => l.status === 'Hot').length
  const last7Contacted = last7.filter((l) => l.status === 'Contacted').length
  const prev7Contacted = prev7.filter((l) => l.status === 'Contacted').length

  const contactRate7 = last7Count > 0 ? (last7Contacted / last7Count) * 100 : 0
  const contactRatePrev = prev7Count > 0 ? (prev7Contacted / prev7Count) * 100 : 0
  const won7 = last7.filter((l) => l.status === 'Won').length
  const wonPrev = prev7.filter((l) => l.status === 'Won').length

  const totalDelta = calculateDelta(last7Count, prev7Count)
  const hotDelta = calculateDelta(last7Hot, prev7Hot)
  const contactDelta = calculateDelta(contactRate7, contactRatePrev)
  const wonDelta = calculateDelta(won7, wonPrev)

  const cards = [
    {
      label: 'Total leads (7d)',
      value: last7Count.toLocaleString(),
      delta: totalDelta.value,
      tone: totalDelta.tone,
      icon: <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />,
    },
    {
      label: 'Hot leads',
      value: last7Hot.toLocaleString(),
      delta: hotDelta.value,
      tone: hotDelta.tone,
      icon: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
    },
    {
      label: 'Contact rate',
      value: `${Math.round(contactRate7)}%`,
      delta: contactDelta.value,
      tone: contactDelta.tone,
      icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    },
    {
      label: 'Won (7d)',
      value: won7.toLocaleString(),
      delta: wonDelta.value,
      tone: wonDelta.tone,
      icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="animate-slide-up rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:-translate-y-px hover:shadow-md transition-all"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-slate-500">{c.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {c.value}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                {c.icon}
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={[
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                c.tone === 'up'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                  : c.tone === 'down'
                    ? 'bg-rose-50 text-rose-700 ring-rose-100'
                    : 'bg-slate-50 text-slate-600 ring-slate-200',
              ].join(' ')}
            >
              {c.tone === 'up' && (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
              {c.tone === 'down' && (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {c.delta}
            </span>
            <span className="text-xs text-slate-500">vs prev week</span>
          </div>
        </div>
      ))}
    </div>
  )
}
