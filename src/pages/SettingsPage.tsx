import { useCallback, useState } from "react";
import { Database01, Lock01, Settings01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { getScriptUrl, setScriptUrl } from "../lib/api";

export default function SettingsPage() {
  const [url, setUrl] = useState(getScriptUrl());
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Outgrow2026") {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleSave = useCallback(() => {
    setScriptUrl(url);
    // Show a success state or notification if needed
    alert("Settings saved successfully");
  }, [url]);

  const handleDisconnect = useCallback(() => {
    setScriptUrl("");
    setUrl("");
  }, []);

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center space-y-6 animate-in fade-in duration-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-utility-brand-50 ring-8 ring-utility-brand-50/50">
          <Lock01 className="size-8 text-utility-brand-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary">Protected Area</h2>
          <p className="text-tertiary mt-2">
            Please enter the master password to access the application settings.
          </p>
        </div>
        <form onSubmit={handleUnlock} className="w-full space-y-4">
          <Input
            label="Master Password"
            placeholder="Enter password..."
            type="password"
            value={password}
            onChange={(val) => {
              setPassword(val);
              if (error) setError(false);
            }}
            error={error ? "Incorrect password" : undefined}
          />
          <Button type="submit" color="primary" className="w-full">
            Unlock Settings
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
          <Settings01 className="size-6 text-utility-brand-600" />
          Settings
        </h2>
        <p className="text-tertiary mt-1">
          Manage your data sources and system configurations.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4 rounded-xl bg-secondary p-4 ring-1 ring-secondary">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-utility-green-50 text-utility-green-600">
            <Database01 className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-primary">Supabase Database</div>
            <div className="text-sm text-tertiary mt-0.5">
              Your leads are securely stored and served from Supabase. This connection is active and managed via environment variables.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-secondary bg-primary shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary bg-secondary/50">
            <h3 className="text-sm font-semibold text-primary">Google Sheets Integration</h3>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-tertiary">
              Sync leads directly from your Google Sheet. Paste your deployed Google Apps Script Web App URL below.
            </p>
            
            <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-4">
                <Input
                  label="Apps Script Web App URL"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  type="url"
                  value={url}
                  onChange={(value) => setUrl(value)}
                />
                
                <div className="rounded-lg bg-secondary p-4 text-xs text-tertiary space-y-2">
                  <div className="font-semibold text-secondary flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-1 ring-secondary text-[10px]">!</span>
                    Setup Instructions
                  </div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Open your Google Sheet &rarr; <b>Extensions &rarr; Apps Script</b>.</li>
                    <li>Paste the script from <code className="rounded bg-primary px-1 py-0.5 ring-1 ring-secondary">apps-script/Code.gs</code>.</li>
                    <li><b>Deploy &rarr; New Deployment &rarr; Web App</b>, set access to &quot;Anyone&quot;.</li>
                    <li>Copy the deployment URL and paste it above.</li>
                  </ol>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-secondary">
                  <Button size="sm" color="link-gray" onClick={handleDisconnect}>
                    Disconnect Sync
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button size="sm" color="primary" type="submit">
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          </div>
        </div>

        <div className="rounded-xl border border-secondary bg-primary shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary bg-secondary/50">
            <h3 className="text-sm font-semibold text-primary">Email Notifications (Vercel)</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-tertiary">
              Configuring daily email digests requires server-side environment variables in your Vercel project.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "RESEND_API_KEY",
                "RESEND_FROM_EMAIL",
                "RESEND_TO_EMAIL",
                "SUPABASE_URL",
                "SUPABASE_SERVICE_ROLE_KEY"
              ].map((key) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary ring-1 ring-secondary">
                  <code className="text-[10px] font-mono text-secondary">{key}</code>
                  <div className="h-1.5 w-1.5 rounded-full bg-utility-green-500" />
                </div>
              ))}
            </div>
            <div className="pt-2 text-xs text-tertiary">
              Cron Endpoint: <code className="rounded bg-secondary px-1.5 py-0.5 border border-secondary">/api/daily-leads-summary</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
