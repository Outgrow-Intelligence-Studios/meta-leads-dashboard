import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import StatsCards from "./components/StatsCards";
import LeadsTable from "./components/LeadsTable";
import SettingsModal from "./components/SettingsModal";
import DashboardPage from "./pages/DashboardPage";
import CampaignsPage from "./pages/CampaignsPage";
import AudiencePage from "./pages/AudiencePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { fetchLeads, getScriptUrl, type Lead } from "./lib/api";
import { Button } from "@/components/base/buttons/button";
import { ChevronRight, RefreshCw01, Settings01 } from "@untitledui/icons";

function getPageFromHash(): string {
  const hash = window.location.hash.replace("#", "");
  if (!hash || hash === "/") return "leads";
  return hash.replace("/", "");
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(getPageFromHash);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "/settings") {
        setSettingsOpen(true);
      } else {
        setCurrentPage(getPageFromHash());
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
      setLastSync(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSettingsSaved = useCallback(() => {
    setSettingsOpen(false);
    window.location.hash = `#/${currentPage}`;
    loadData();
  }, [loadData, currentPage]);

  const hasUrl = Boolean(getScriptUrl());

  const pageTitle =
    currentPage === "leads"
      ? "Meta Leads"
      : currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

  let pageContent: React.ReactNode;
  if (error) {
    pageContent = (
      <div className="flex items-start gap-3 rounded-xl bg-utility-red-50 p-4 ring-1 ring-utility-red-200">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-utility-red-100 text-utility-red-700">
          <span className="text-sm font-bold">!</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-utility-red-700">Error loading data</div>
          <div className="text-sm text-utility-red-500 mt-0.5">{error}</div>
        </div>
      </div>
    );
  } else if (currentPage === "dashboard") {
    pageContent = <DashboardPage leads={leads} />;
  } else if (currentPage === "campaigns") {
    pageContent = <CampaignsPage />;
  } else if (currentPage === "audience") {
    pageContent = <AudiencePage />;
  } else if (currentPage === "analytics") {
    pageContent = <AnalyticsPage leads={leads} />;
  } else {
    pageContent = (
      <>
        <StatsCards leads={leads} />
        <LeadsTable
          leads={leads}
          onChange={(updater) => setLeads(updater)}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-primary text-primary antialiased">
      <Sidebar />

      <main className="flex-1 min-w-0 bg-primary">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-secondary bg-secondary/60 px-6 py-4 shadow-xs backdrop-blur-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-tertiary">
              <span>Dashboard</span>
              <ChevronRight className="size-3 stroke-[3px]" />
              <span className="text-secondary font-medium">{pageTitle}</span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight truncate text-primary">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center rounded-lg bg-secondary px-3 py-1.5 ring-1 ring-inset ring-secondary shadow-xs">
              <span className="flex items-center gap-1.5 text-xs font-medium text-tertiary">
                <span className="relative flex h-2 w-2 bg-utility-green-500 rounded-full" />
                Supabase
              </span>
            </div>

            {lastSync && (
              <span className="hidden lg:inline text-xs text-tertiary">
                Synced {lastSync.toLocaleTimeString()}
              </span>
            )}

            <Button
              size="sm"
              color="secondary"
              iconLeading={RefreshCw01}
              isLoading={loading}
              onClick={loadData}
            >
              Refresh
            </Button>

            <Button
              size="sm"
              color="primary"
              iconLeading={Settings01}
              onClick={() => {
                window.location.hash = "#/settings";
              }}
            >
              Settings
            </Button>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {!hasUrl && (
            <div className="flex items-start gap-3 rounded-xl bg-utility-yellow-50 p-4 ring-1 ring-utility-yellow-200">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-utility-yellow-100 text-utility-yellow-700">
                <span className="text-sm font-bold">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-utility-yellow-700">
                  No data source connected
                </div>
                <div className="text-sm text-utility-yellow-600 mt-0.5">
                  Connect your Google Sheet in Settings to start tracking leads.
                </div>
              </div>
              <Button
                size="xs"
                color="secondary"
                onClick={() => {
                  window.location.hash = "#/settings";
                }}
              >
                Connect
              </Button>
            </div>
          )}

          {!error && leads.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-utility-green-50 p-4 ring-1 ring-utility-green-200">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-utility-green-100 text-utility-green-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-utility-green-700">
                  Connected to Supabase
                </div>
                <div className="text-sm text-utility-green-600 mt-0.5">
                  {leads.length} lead{leads.length !== 1 ? "s" : ""} stored in database.
                </div>
              </div>
            </div>
          )}

          {!error && pageContent}

          <footer className="flex items-center justify-center gap-1.5 pt-2 pb-4 text-xs text-tertiary">
            <span>Powered by</span>
            <img src="https://www.letsoutgrow.com/oglogo.png" alt="Outgrow" className="h-4 w-auto opacity-90" />
          </footer>
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          window.location.hash = `#/${currentPage}`;
        }}
        onSaved={handleSettingsSaved}
      />
    </div>
  );
}
