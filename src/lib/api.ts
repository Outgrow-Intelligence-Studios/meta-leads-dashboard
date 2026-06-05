import { supabase } from "./supabase";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  location: string;
  sales_person: string;
  remark_1: string;
  remark_2: string;
  status: "New" | "Contacted" | "Hot" | "Won" | "Lost";
  follow_up: string | null;
  follow_up_2: string | null;
  created_at: string;
  updated_at: string;
};

const CRM_META_PREFIX = "__crm_meta__";

type LeadNotesMeta = {
  feedback: string;
  location: string;
  sales_person: string;
  remark_1: string;
  remark_2: string;
};

function parseLeadNotes(raw: string): LeadNotesMeta {
  if (!raw) {
    return {
      feedback: "",
      location: "",
      sales_person: "",
      remark_1: "",
      remark_2: "",
    };
  }

  if (!raw.startsWith(CRM_META_PREFIX)) {
    return {
      feedback: raw,
      location: "",
      sales_person: "",
      remark_1: "",
      remark_2: "",
    };
  }

  try {
    const parsed = JSON.parse(raw.slice(CRM_META_PREFIX.length)) as Partial<LeadNotesMeta>;
    return {
      feedback: String(parsed.feedback ?? ""),
      location: String(parsed.location ?? ""),
      sales_person: String(parsed.sales_person ?? ""),
      remark_1: String(parsed.remark_1 ?? ""),
      remark_2: String(parsed.remark_2 ?? ""),
    };
  } catch {
    return {
      feedback: raw,
      location: "",
      sales_person: "",
      remark_1: "",
      remark_2: "",
    };
  }
}

function serializeLeadNotes(meta: Partial<LeadNotesMeta>): string {
  const normalized: LeadNotesMeta = {
    feedback: String(meta.feedback ?? ""),
    location: String(meta.location ?? ""),
    sales_person: String(meta.sales_person ?? ""),
    remark_1: String(meta.remark_1 ?? ""),
    remark_2: String(meta.remark_2 ?? ""),
  };

  const hasStructuredFields =
    normalized.location ||
    normalized.sales_person ||
    normalized.remark_1 ||
    normalized.remark_2;

  if (!hasStructuredFields) return normalized.feedback;
  return `${CRM_META_PREFIX}${JSON.stringify(normalized)}`;
}

function toDatabaseLeadUpdate(updates: Partial<Lead>) {
  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    location,
    sales_person,
    remark_1,
    remark_2,
    notes,
    ...rest
  } = updates;

  const payload: Record<string, unknown> = { ...rest };
  const hasNotesPayload =
    location !== undefined ||
    sales_person !== undefined ||
    remark_1 !== undefined ||
    remark_2 !== undefined ||
    notes !== undefined;

  if (hasNotesPayload) {
    payload.notes = serializeLeadNotes({
      feedback: notes,
      location,
      sales_person,
      remark_1,
      remark_2,
    });
  }

  return payload;
}

const STORAGE_KEY = "meta_leads_apps_script_url";

const DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycbxf2PZZ13u1SeUb4s-Zd4Ew1n7ruM57Q2o2TM9I5RGwSvIPlBXMia-_YvY62g4Zkk_j/exec";

export function getScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setScriptUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

function toLead(row: Record<string, unknown>): Lead {
  const leadNotes = parseLeadNotes(String(row.notes ?? ""));
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? "N/A"),
    source: String(row.source ?? "Landing Page"),
    notes: leadNotes.feedback,
    location: leadNotes.location,
    sales_person: leadNotes.sales_person,
    remark_1: leadNotes.remark_1,
    remark_2: leadNotes.remark_2,
    status: (row.status ?? "New") as Lead["status"],
    follow_up: (row.follow_up as string) || null,
    follow_up_2: (row.follow_up_2 as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function fetchLeads(): Promise<Lead[]> {
  let supabaseLeads: Lead[] = [];
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      supabaseLeads = (data as Record<string, unknown>[]).map(toLead);
    }
  } catch {
    // ignore
  }

  let sheetLeads: Lead[] = [];
  const scriptUrl = getScriptUrl();
  if (scriptUrl) {
    try {
      const res = await fetch(scriptUrl);
      if (res.ok) {
        const json = await res.json();
        const raw = (json.leads ?? []) as Array<Record<string, unknown>>;
        sheetLeads = raw.map((r) =>
          toLead({
            id: `sheet-${r.row ?? crypto.randomUUID()}`,
            name: r.name,
            email: r.email,
            phone: r.phone,
            source: r.source,
            notes: r.notes,
            status: r.status,
            follow_up: null,
            follow_up_2: null,
            created_at: r.timestamp,
            updated_at: r.timestamp,
          })
        );
      }
    } catch {
      // ignore
    }
  }

  const merged = new Map<string, Lead>();
  for (const l of supabaseLeads) merged.set(l.id, l);
  for (const l of sheetLeads) {
    const emailKey = l.email.toLowerCase();
    const existing = Array.from(merged.values()).find(
      (m) => m.email.toLowerCase() === emailKey
    );
    if (!existing) merged.set(l.id, l);
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function addLead(lead: {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
  status?: string;
}): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "N/A",
      source: lead.source || "Landing Page",
      notes: serializeLeadNotes({ feedback: lead.notes || "" }),
      status: lead.status || "New",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toLead(data as Record<string, unknown>);
}

export async function updateLead(
  id: string,
  updates: Partial<Lead>
): Promise<Lead> {
  const payload = toDatabaseLeadUpdate(updates);

  if (id.startsWith("sheet-")) {
    const rest = payload as Record<string, unknown>;
    const insertPayload = {
      name: rest.name ?? "",
      email: rest.email ?? "",
      phone: rest.phone ?? "N/A",
      source: rest.source ?? "Landing Page",
      notes: rest.notes ?? "",
      status: rest.status ?? "New",
      follow_up: rest.follow_up ?? null,
      follow_up_2: rest.follow_up_2 ?? null,
      created_at: rest.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toLead(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("leads")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toLead(data as Record<string, unknown>);
}

export async function deleteLead(id: string): Promise<void> {
  if (id.startsWith("sheet-")) {
    return;
  }
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
