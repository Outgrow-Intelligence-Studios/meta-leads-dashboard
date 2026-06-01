export type Lead = {
  id: string
  name: string
  email: string
  phone: string
  source: string
  notes: string
  status: 'New' | 'Contacted' | 'Hot' | 'Won' | 'Lost'
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'meta_leads_apps_script_url'

export function getScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function setScriptUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url.trim())
}

async function request(endpoint: string, options?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(endpoint, {
    redirect: 'follow',
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.status !== 'success') throw new Error(String(data.message || 'Request failed'))
  return data
}

function parseLeads(raw: Array<Record<string, unknown>>): Lead[] {
  return raw.map((l) => ({
    id: String(l.row ?? crypto.randomUUID()),
    name: String(l.name ?? ''),
    email: String(l.email ?? ''),
    phone: String(l.phone ?? 'N/A'),
    source: String(l.source ?? 'Landing Page'),
    notes: String(l.notes ?? ''),
    status: String(l.status ?? 'New') as Lead['status'],
    created_at: String(l.timestamp ?? new Date().toISOString()),
    updated_at: String(l.timestamp ?? new Date().toISOString()),
  }))
}

export async function fetchLeads(): Promise<Lead[]> {
  const url = getScriptUrl()
  if (!url) return []
  const data = await request(url, { method: 'GET' })
  return parseLeads(data.leads as Array<Record<string, unknown>>)
}

export async function addLead(lead: {
  name: string
  email: string
  phone?: string
  source?: string
  notes?: string
  status?: string
}): Promise<Lead> {
  const url = getScriptUrl()
  if (!url) throw new Error('No Apps Script URL configured')
  await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'add', ...lead }),
  })
  return {
    id: crypto.randomUUID(),
    name: lead.name,
    email: lead.email,
    phone: lead.phone || 'N/A',
    source: lead.source || 'Landing Page',
    notes: lead.notes || '',
    status: (lead.status || 'New') as Lead['status'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const url = getScriptUrl()
  if (!url) throw new Error('No Apps Script URL configured')
  const rowNumber = parseInt(id, 10)
  if (isNaN(rowNumber)) throw new Error('Invalid lead ID')
  if (updates.notes !== undefined) {
    await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateNote', row: rowNumber, note: updates.notes }),
    })
  }
  if (updates.status !== undefined) {
    await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateStatus', row: rowNumber, status: updates.status }),
    })
  }
  return {
    id,
    name: updates.name || '',
    email: updates.email || '',
    phone: updates.phone || '',
    source: updates.source || '',
    notes: updates.notes || '',
    status: updates.status || 'New',
    created_at: updates.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function deleteLead(id: string): Promise<void> {
  const url = getScriptUrl()
  if (!url) throw new Error('No Apps Script URL configured')
  const rowNumber = parseInt(id, 10)
  if (isNaN(rowNumber)) throw new Error('Invalid lead ID')
  await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', row: rowNumber }),
  })
}
