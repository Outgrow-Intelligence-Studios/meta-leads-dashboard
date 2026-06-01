import { useEffect, useMemo, useRef, useState } from 'react'
import type { Lead } from '../lib/api'
import { updateLead, deleteLead, addLead } from '../lib/api'

type Props = {
  leads: Lead[]
  onChange: (updater: (prev: Lead[]) => Lead[]) => void
  loading: boolean
}

const STATUSES = ['New', 'Contacted', 'Hot', 'Won', 'Lost'] as const

const statusStyles: Record<string, string> = {
  New: 'bg-blue-50 text-blue-700 ring-blue-100',
  Contacted: 'bg-amber-50 text-amber-700 ring-amber-100',
  Hot: 'bg-rose-50 text-rose-700 ring-rose-100',
  Won: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Lost: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function avatarColor(seed: string) {
  const palette = [
    'from-indigo-500 to-violet-600',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i)
  return palette[Math.abs(hash) % palette.length]
}

export default function LeadsTable({ leads, onChange, loading }: Props) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [sortKey, setSortKey] = useState<'created_at' | 'name'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [savingLead, setSavingLead] = useState<Record<string, string | null>>({})
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'err' } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Landing Page',
    notes: '',
  })
  const [addingLead, setAddingLead] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = leads.filter((l) => {
      if (statusFilter !== 'All' && l.status !== statusFilter) return false
      if (!q) return true
      return (
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.source?.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q)
      )
    })
    out = [...out].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        cmp = (a.name || '').localeCompare(b.name || '')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return out
  }, [leads, query, statusFilter, sortKey, sortDir])

  function toggleSort(key: 'created_at' | 'name') {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  async function persistNote(id: string, note: string) {
    setSavingLead((s) => ({ ...s, [id]: 'note' }))
    try {
      await updateLead(id, { notes: note })
      setToast({ msg: 'Note saved.', tone: 'ok' })
    } catch (e) {
      setToast({ msg: `Save failed: ${(e as Error).message}`, tone: 'err' })
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }))
    }
  }

  async function changeStatus(id: string, status: string) {
    const typedStatus = status as Lead['status']
    onChange((prev) => prev.map((l) => (l.id === id ? { ...l, status: typedStatus } : l)))
    setSavingLead((s) => ({ ...s, [id]: 'status' }))
    try {
      await updateLead(id, { status: typedStatus })
    } catch (e) {
      setToast({ msg: `Status update failed: ${(e as Error).message}`, tone: 'err' })
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }))
    }
  }

  async function removeLead(id: string) {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    setSavingLead((s) => ({ ...s, [id]: 'delete' }))
    try {
      await deleteLead(id)
      onChange((prev) => prev.filter((l) => l.id !== id))
      setToast({ msg: 'Lead deleted.', tone: 'ok' })
    } catch (e) {
      setToast({ msg: `Delete failed: ${(e as Error).message}`, tone: 'err' })
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }))
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    if (!newLead.name || !newLead.email) {
      setToast({ msg: 'Name and email are required', tone: 'err' })
      return
    }
    setAddingLead(true)
    try {
      const lead = await addLead(newLead)
      onChange((prev) => [lead as Lead, ...prev])
      setNewLead({ name: '', email: '', phone: '', source: 'Landing Page', notes: '' })
      setShowAddForm(false)
      setToast({ msg: 'Lead added successfully', tone: 'ok' })
    } catch (e) {
      setToast({ msg: `Add failed: ${(e as Error).message}`, tone: 'err' })
    } finally {
      setAddingLead(false)
    }
  }

  function exportCsv() {
    const headers = ['Timestamp', 'Name', 'Email', 'Phone', 'Source', 'Status', 'Notes']
    const rows = filtered.map((l) =>
      [l.created_at, l.name, l.email, l.phone, l.source, l.status, l.notes]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meta-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-slide-up rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            All leads
            <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              {filtered.length}
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Captured from Meta ad campaigns. Updates sync in real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-64 rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option>All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            Export
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Lead
          </button>
        </div>
      </div>

      {/* Add Lead Form */}
      {showAddForm && (
        <div className="animate-fade-in px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleAddLead} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={addingLead}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="Enter email"
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={addingLead}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="Enter phone"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={addingLead}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                <input
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  placeholder="Enter source"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={addingLead}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-end md:gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Add notes..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={addingLead}
                />
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  disabled={addingLead}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLead}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {addingLead ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014.13-3.36M19 5a9 9 0 00-14.13 3.36" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Lead
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/70 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">
                <button
                  onClick={() => toggleSort('name')}
                  className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                >
                  Lead
                  {sortKey === 'name' && (
                    <span>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort('created_at')}
                  className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                >
                  Captured
                  {sortKey === 'created_at' && (
                    <span>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 min-w-[260px]">Notes</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    Loading leads...
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h4m6-12H4a1 1 0 00-1 1v15a1 1 0 001 1h16a1 1 0 001-1V6a1 1 0 00-1-1zM9 5V3h6v2" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">No leads yet</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      When your Meta ad campaigns generate leads, they'll appear here.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  saving={savingLead[lead.id] || null}
                  onNoteBlur={persistNote}
                  onStatusChange={changeStatus}
                  onDelete={removeLead}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={[
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ring-1 transition-all animate-fade-in',
            toast.tone === 'ok'
              ? 'bg-white text-emerald-700 ring-emerald-200'
              : 'bg-white text-rose-700 ring-rose-200',
          ].join(' ')}
        >
          <span
            className={[
              'h-2 w-2 rounded-full',
              toast.tone === 'ok' ? 'bg-emerald-500' : 'bg-rose-500',
            ].join(' ')}
          />
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function LeadRow({
  lead,
  saving,
  onNoteBlur,
  onStatusChange,
  onDelete,
}: {
  lead: Lead
  saving: string | null
  onNoteBlur: (id: string, note: string) => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const [note, setNote] = useState(lead.notes)
  const initialNote = useRef(lead.notes)

  useEffect(() => {
    setNote(lead.notes)
    initialNote.current = lead.notes
  }, [lead.notes])

  function handleBlur() {
    if (note === initialNote.current) return
    initialNote.current = note
    onNoteBlur(lead.id, note)
  }

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-xs font-semibold ${avatarColor(
              lead.name || lead.email
            )}`}
          >
            {initials(lead.name || '?')}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">
              {lead.name || '\u2014'}
            </div>
            <div className="text-xs text-slate-500 truncate">{lead.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-slate-600">
        <div className="text-sm">{lead.phone || '\u2014'}</div>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100">
          {lead.source || '\u2014'}
        </span>
      </td>
      <td className="px-4 py-3.5 text-slate-600">
        <div className="text-sm">{formatDate(lead.created_at)}</div>
      </td>
      <td className="px-4 py-3.5">
        <div className="relative inline-block">
          <select
            value={lead.status || 'New'}
            onChange={(e) => onStatusChange(lead.id, e.target.value)}
            className={[
              'appearance-none rounded-full pl-2.5 pr-7 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors',
              statusStyles[lead.status] || statusStyles.New,
            ].join(' ')}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleBlur}
            rows={1}
            placeholder="Add a note..."
            className="w-full min-w-[240px] resize-y rounded-md border border-transparent bg-slate-50/60 px-2.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
          />
          {saving === 'note' && (
            <span className="absolute -top-1 right-1 text-[10px] text-indigo-500">
              saving...
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <button
          onClick={() => onDelete(lead.id)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          title="Delete lead"
          disabled={saving === 'delete'}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
        </button>
      </td>
    </tr>
  )
}
