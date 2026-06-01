import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import StatsCards from './components/StatsCards'
import LeadsTable from './components/LeadsTable'
import SettingsModal from './components/SettingsModal'
import DashboardPage from './pages/DashboardPage'
import CampaignsPage from './pages/CampaignsPage'
import AudiencePage from './pages/AudiencePage'
import AnalyticsPage from './pages/AnalyticsPage'
import { fetchLeads, getScriptUrl, type Lead } from './lib/api'

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState('leads')

  const loadData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchLeads()
      setLeads(data)
      setLastSync(new Date())
    } catch (e) {
      setError((e as Error).message)
      console.error('Failed to load leads:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleNavigate = useCallback((page: string) => {
    if (page === 'settings') {
      setSettingsOpen(true)
      return
    }
    setCurrentPage(page)
  }, [])

  const handleSettingsSaved = useCallback(() => {
    setSettingsOpen(false)
    loadData()
  }, [loadData])

  const hasUrl = Boolean(getScriptUrl())

  const pageTitle = currentPage === 'leads' ? 'Meta Leads' : currentPage.charAt(0).toUpperCase() + currentPage.slice(1)

  let pageContent: React.ReactNode
  if (error) {
    pageContent = (
      <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0020.66 16L13.73 4a2 2 0 003.46 0L3.34 16A2 2 0 005.07 19z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-rose-900">Error loading data</div>
          <div className="text-sm text-rose-800/80 mt-0.5">{error}</div>
        </div>
      </div>
    )
  } else if (currentPage === 'dashboard') {
    pageContent = <DashboardPage leads={leads} />
  } else if (currentPage === 'campaigns') {
    pageContent = <CampaignsPage />
  } else if (currentPage === 'audience') {
    pageContent = <AudiencePage />
  } else if (currentPage === 'analytics') {
    pageContent = <AnalyticsPage leads={leads} />
  } else {
    pageContent = (
      <>
        <StatsCards leads={leads} />
        <LeadsTable
          leads={leads}
          loading={loading}
          onChange={(updater) => setLeads(updater)}
        />
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Sidebar active={currentPage} leadCount={leads.length} onNavigate={handleNavigate} />

      <main className="flex-1 min-w-0 bg-dots">
        {/* Glass header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/70 px-6 py-4 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Dashboard</span>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-700 font-medium">{pageTitle}</span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            <div className="hidden md:flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-inset ring-slate-200 shadow-xs">
              <span className="relative flex h-2 w-2">
                {hasUrl && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${hasUrl ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </span>
              <span className="text-xs font-medium text-slate-600">
                {hasUrl ? 'Connected' : 'No source'}
              </span>
            </div>

            {lastSync && (
              <span className="hidden lg:inline text-xs text-slate-500">
                Synced {lastSync.toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={loadData}
              disabled={loading}
              className="active:scale-[0.97] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:shadow-sm disabled:opacity-50 transition-all"
            >
              <svg
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014.13-3.36M19 5a9 9 0 00-14.13 3.36" />
              </svg>
              Refresh
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="active:scale-[0.97] inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317a1 1 0 011.35 0l1.262 1.13a1 1 0 00.985.227l1.62-.486a1 1 0 011.28.83l.231 1.681a1 1 0 00.602.78l1.55.69a1 1 0 01.54 1.272l-.597 1.59a1 1 0 000 .708l.597 1.59a1 1 0 01-.54 1.272l-1.55.69a1 1 0 00-.602.78l-.231 1.681a1 1 0 01-1.281.83l-1.62-.486a1 1 0 00-.985.227l-1.262 1.13a1 1 0 01-1.35 0l-1.262-1.13a1 1 0 00-.985-.227l-1.62.486a1 1 0 01-1.281-.83l-.231-1.681a1 1 0 00-.602-.78l-1.55-.69a1 1 0 01-.54-1.272l.597-1.59a1 1 0 000-.708l-.597-1.59a1 1 0 01.54-1.272l1.55-.69a1 1 0 00.602-.78l.231-1.681a1 1 0 011.281-.83l1.62.486a1 1 0 00.985-.227l1.262-1.13z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Empty state banner */}
          {!hasUrl && (
            <div className="animate-slide-down flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0020.66 16L13.73 4a2 2 0 003.46 0L3.34 16A2 2 0 005.07 19z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-amber-900">
                  No data source connected
                </div>
                <div className="text-sm text-amber-800/80 mt-0.5">
                  Connect your Google Sheet in Settings to start tracking leads.
                </div>
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className="shrink-0 rounded-lg bg-amber-900/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 transition-colors"
              >
                Connect
              </button>
            </div>
          )}

          {/* Connected banner */}
          {hasUrl && !error && leads.length > 0 && (
            <div className="animate-slide-down flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-emerald-900">
                  Connected to Google Sheets
                </div>
                <div className="text-sm text-emerald-800/80 mt-0.5">
                  {leads.length} lead{leads.length !== 1 ? 's' : ''} loaded from your sheet.
                </div>
              </div>
            </div>
          )}

          {!error && pageContent}

          <footer className="pt-2 pb-4 text-center text-xs text-slate-400">
            Leadflow &middot; Meta Ads CRM &middot; Powered by Google Sheets
          </footer>
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={handleSettingsSaved}
      />
    </div>
  )
}
