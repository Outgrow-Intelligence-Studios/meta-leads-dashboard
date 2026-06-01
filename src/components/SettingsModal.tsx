import { useEffect, useState } from 'react'
import { getScriptUrl, setScriptUrl } from '../lib/api'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function SettingsModal({ open, onClose, onSaved }: Props) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (open) setUrl(getScriptUrl())
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-slide-up">
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 ring-8 ring-indigo-50/50">
              <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317a1 1 0 011.35 0l1.262 1.13a1 1 0 00.985.227l1.62-.486a1 1 0 011.28.83l.231 1.681a1 1 0 00.602.78l1.55.69a1 1 0 01.54 1.272l-.597 1.59a1 1 0 000 .708l.597 1.59a1 1 0 01-.54 1.272l-1.55.69a1 1 0 00-.602.78l-.231 1.681a1 1 0 01-1.281.83l-1.62-.486a1 1 0 00-.985.227l-1.262 1.13a1 1 0 01-1.35 0l-1.262-1.13a1 1 0 00-.985-.227l-1.62.486a1 1 0 01-1.281-.83l-.231-1.681a1 1 0 00-.602-.78l-1.55-.69a1 1 0 01-.54-1.272l.597-1.59a1 1 0 000-.708l-.597-1.59a1 1 0 01.54-1.272l1.55-.69a1 1 0 00.602-.78l.231-1.681a1 1 0 011.281-.83l1.62.486a1 1 0 00.985-.227l1.262-1.13z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Settings</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Connect your Google Sheet to the dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Apps Script Web App URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-2.5 text-xs text-slate-600 space-y-1">
              <div className="font-medium text-slate-700">Quick setup</div>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Open your Google Sheet &rarr; <b>Extensions &rarr; Apps Script</b>.</li>
                <li>Paste the script from <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">apps-script/Code.gs</code>.</li>
                <li><b>Deploy &rarr; New Deployment &rarr; Web App</b>, set access to "Anyone".</li>
                <li>Copy the deployment URL and paste it above.</li>
              </ol>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-6">
            <button
              onClick={() => {
                setScriptUrl('')
                setUrl('')
                onSaved()
              }}
              className="text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              Disconnect
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setScriptUrl(url)
                  onSaved()
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
