import { useState } from 'react'

type Props = {
  active: string
  leadCount?: number
  onNavigate: (page: string) => void
}

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { id: 'leads', label: 'Meta Leads', icon: 'M3 7h18M3 12h18M3 17h18' },
  { id: 'campaigns', label: 'Campaigns', icon: 'M11 3l9 4-9 4-9-4 9-4zM2 17l9 4 9-4M2 12l9 4 9-4' },
  { id: 'audience', label: 'Audience', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'analytics', label: 'Analytics', icon: 'M3 3v18h18M7 15l4-4 4 4 6-6' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317a1 1 0 011.35 0l1.262 1.13a1 1 0 00.985.227l1.62-.486a1 1 0 00.985.227l1.55.69a1 1 0 01.54 1.272l-.597 1.59a1 1 0 000 .708l.597 1.59a1 1 0 01-.54 1.272l-1.55.69a1 1 0 00-.602.78l-.23 1.681a1 1 0 01-1.281.83l-1.62-.486a1 1 0 00-.985.227l-1.262 1.13a1 1 0 01-1.35 0l-1.262-1.13a1 1 0 00-.985-.227l-1.62.486a1 1 0 01-1.281-.83l-.23-1.681a1 1 0 00-.602-.78l-1.55-.69a1 1 0 01-.54-1.272l.597-1.59a1 1 0 000-.708l-.597-1.59a1 1 0 01.54-1.272l1.55-.69a1 1 0 00.602-.78l.23-1.681a1 1 0 011.281-.83l1.62.486a1 1 0 00.985-.227l1.262-1.13z' },
]

export default function Sidebar({ active, leadCount, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`hidden lg:flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-slate-100 min-h-[68px]">
        <img
          src="https://mailing.columbus-cleaning.com/columbus-logo.svg"
          alt="Logo"
          className={`object-contain transition-all duration-300 ${
            collapsed ? 'w-7 h-7' : 'max-h-9 w-auto'
          }`}
        />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={[
                'w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                collapsed ? 'justify-center px-0' : '',
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
            >
              <svg
                className={`h-5 w-5 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              <span
                className={`overflow-hidden transition-all duration-300 ${
                  collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
              >
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
              {!collapsed && item.id === 'leads' && leadCount !== undefined && leadCount > 0 && (
                <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-100 tabular-nums">
                  {leadCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center w-full py-3 border-t border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  )
}
