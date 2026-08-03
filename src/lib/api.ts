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
  status: "New" | "Contacted" | "Hot" | "Won" | "Lost" | "No Ans";
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

function toDatabaseLeadUpdate(updates: Partial<Lead>, currentLead?: Lead) {
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
      feedback: notes !== undefined ? notes : (currentLead?.notes ?? ""),
      location: location !== undefined ? location : (currentLead?.location ?? ""),
      sales_person: sales_person !== undefined ? sales_person : (currentLead?.sales_person ?? ""),
      remark_1: remark_1 !== undefined ? remark_1 : (currentLead?.remark_1 ?? ""),
      remark_2: remark_2 !== undefined ? remark_2 : (currentLead?.remark_2 ?? ""),
    });
  }

  return payload;
}

const STORAGE_KEY = "meta_leads_apps_script_url";

const DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycbz-jP5TnOgJeuC8IdBZnuAuw_RMIZeIz3XSH00ebO9k_LwhL9e0fu1dTxMuH9AQQEjO/exec";

export function getScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setScriptUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

function toLead(row: Record<string, unknown>): Lead {
  const leadNotes = parseLeadNotes(String(row.notes ?? ""));
  const VALID_STATUSES = ["New", "Contacted", "Hot", "Won", "Lost", "No Ans"];
  const rawStatus = String(row.status ?? "New").trim();
  const isValidStatus = VALID_STATUSES.includes(rawStatus);

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? "N/A"),
    source: String(row.source ?? "Landing Page"),
    notes: leadNotes.feedback,
    location: leadNotes.location || (!isValidStatus ? rawStatus : ""),
    sales_person: leadNotes.sales_person,
    remark_1: leadNotes.remark_1,
    remark_2: leadNotes.remark_2,
    status: (isValidStatus ? rawStatus : "New") as Lead["status"],
    follow_up: row.follow_up ? String(row.follow_up) : null,
    follow_up_2: row.follow_up_2 ? String(row.follow_up_2) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
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

  // Step 1: Collect all leads
  const allLeads = [...supabaseLeads, ...sheetLeads];

  // Step 2: Group by email (excluding empty emails)
  const grouped = new Map<string, Lead[]>();
  const emailLessLeads: Lead[] = [];

  for (const l of allLeads) {
    const emailKey = l.email ? l.email.trim().toLowerCase() : "";
    if (!emailKey) {
      // Avoid showing legacy corrupt empty rows (no name, no email, and no phone)
      if (l.name || l.email || (l.phone && l.phone !== "N/A")) {
        emailLessLeads.push(l);
      }
    } else {
      if (!grouped.has(emailKey)) {
        grouped.set(emailKey, []);
      }
      grouped.get(emailKey)!.push(l);
    }
  }

  // Step 3: Merge each group
  const mergedLeadsList: Lead[] = [];

  for (const [_, group] of grouped.entries()) {
    if (group.length === 1) {
      mergedLeadsList.push(group[0]);
      continue;
    }

    // Sort group:
    // 1. Supabase leads first (they have UUID, sheet leads have "sheet-" prefix)
    // 2. Most recently created lead first
    group.sort((a, b) => {
      const aIsSupabase = !a.id.startsWith("sheet-");
      const bIsSupabase = !b.id.startsWith("sheet-");
      if (aIsSupabase !== bIsSupabase) {
        return aIsSupabase ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const primary = group[0];
    const duplicates = group.slice(1);

    // Merge fields from duplicates into primary
    const mergedLead: Lead = { ...primary };

    // Combine notes, remarks without duplication
    const notesSet = new Set<string>();
    if (primary.notes) {
      primary.notes.split(" | ").forEach(n => {
        const trimmed = n.trim();
        if (trimmed) notesSet.add(trimmed);
      });
    }

    const remark1Set = new Set<string>();
    if (primary.remark_1) {
      primary.remark_1.split(" | ").forEach(r => {
        const trimmed = r.trim();
        if (trimmed) remark1Set.add(trimmed);
      });
    }

    const remark2Set = new Set<string>();
    if (primary.remark_2) {
      primary.remark_2.split(" | ").forEach(r => {
        const trimmed = r.trim();
        if (trimmed) remark2Set.add(trimmed);
      });
    }

    for (const dup of duplicates) {
      if (!mergedLead.name && dup.name) mergedLead.name = dup.name;
      if ((!mergedLead.phone || mergedLead.phone === "N/A") && dup.phone && dup.phone !== "N/A") {
        mergedLead.phone = dup.phone;
      }
      if ((!mergedLead.source || mergedLead.source === "Landing Page") && dup.source && dup.source !== "Landing Page") {
        mergedLead.source = dup.source;
      }
      if (!mergedLead.location && dup.location) mergedLead.location = dup.location;
      if (!mergedLead.sales_person && dup.sales_person) mergedLead.sales_person = dup.sales_person;
      if (!mergedLead.follow_up && dup.follow_up) mergedLead.follow_up = dup.follow_up;
      if (!mergedLead.follow_up_2 && dup.follow_up_2) mergedLead.follow_up_2 = dup.follow_up_2;

      // Keep the latest status if primary is New but a duplicate has a valid active status
      const VALID_STATUSES = ["New", "Contacted", "Hot", "Won", "Lost", "No Ans"];
      if (mergedLead.status === "New" && dup.status !== "New" && VALID_STATUSES.includes(dup.status)) {
        mergedLead.status = dup.status;
      }

      if (dup.notes) {
        dup.notes.split(" | ").forEach(n => {
          const trimmed = n.trim();
          if (trimmed) notesSet.add(trimmed);
        });
      }
      if (dup.remark_1) {
        dup.remark_1.split(" | ").forEach(r => {
          const trimmed = r.trim();
          if (trimmed) remark1Set.add(trimmed);
        });
      }
      if (dup.remark_2) {
        dup.remark_2.split(" | ").forEach(r => {
          const trimmed = r.trim();
          if (trimmed) remark2Set.add(trimmed);
        });
      }
    }

    mergedLead.notes = Array.from(notesSet).join(" | ");
    mergedLead.remark_1 = Array.from(remark1Set).join(" | ");
    mergedLead.remark_2 = Array.from(remark2Set).join(" | ");
    mergedLead.updated_at = new Date().toISOString();

    mergedLeadsList.push(mergedLead);

    // Background sync: if primary is a Supabase lead, update it in DB with merged updates
    if (!primary.id.startsWith("sheet-")) {
      const hasUpdates =
        mergedLead.name !== primary.name ||
        mergedLead.phone !== primary.phone ||
        mergedLead.source !== primary.source ||
        mergedLead.location !== primary.location ||
        mergedLead.sales_person !== primary.sales_person ||
        mergedLead.notes !== primary.notes ||
        mergedLead.remark_1 !== primary.remark_1 ||
        mergedLead.remark_2 !== primary.remark_2 ||
        mergedLead.status !== primary.status;

      if (hasUpdates) {
        updateLead(primary.id, {
          name: mergedLead.name,
          phone: mergedLead.phone,
          source: mergedLead.source,
          location: mergedLead.location,
          sales_person: mergedLead.sales_person,
          notes: mergedLead.notes,
          remark_1: mergedLead.remark_1,
          remark_2: mergedLead.remark_2,
          status: mergedLead.status,
        }, primary).catch(() => {});
      }
    }
  }

  // Add the emailless leads
  mergedLeadsList.push(...emailLessLeads);

  // Sort final list by created_at descending
  return mergedLeadsList.sort(
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
  updates: Partial<Lead>,
  currentLead?: Lead
): Promise<Lead> {
  const payload = toDatabaseLeadUpdate(updates, currentLead);

  if (id.startsWith("sheet-")) {
    const insertPayload = {
      name: currentLead?.name ?? updates.name ?? "",
      email: currentLead?.email ?? updates.email ?? "",
      phone: currentLead?.phone ?? updates.phone ?? "N/A",
      source: currentLead?.source ?? updates.source ?? "Landing Page",
      notes: payload.notes ?? serializeLeadNotes({
        feedback: currentLead?.notes ?? "",
        location: currentLead?.location ?? "",
        sales_person: currentLead?.sales_person ?? "",
        remark_1: currentLead?.remark_1 ?? "",
        remark_2: currentLead?.remark_2 ?? "",
        ...updates
      }),
      status: updates.status ?? currentLead?.status ?? "New",
      follow_up: updates.follow_up ?? currentLead?.follow_up ?? null,
      follow_up_2: updates.follow_up_2 ?? currentLead?.follow_up_2 ?? null,
      created_at: currentLead?.created_at ?? updates.created_at ?? new Date().toISOString(),
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

export type CampaignAnalytics = {
  id: string;
  name: string;
  subject: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  total_recipients: number;
  sent_count: number;
  created_at: string;
  actual_sends: number;
  delivered: number;
  total_opens: number;
  unique_opens: number;
  total_clicks: number;
  unique_clicks: number;
  total_bounces: number;
  total_complaints: number;
};

export type CampaignEvent = {
  id: string;
  campaign_id: string;
  email: string;
  event_type: string;
  bounce_type: string | null;
  bounce_subtype: string | null;
  click_url: string | null;
  created_at: string;
};

export async function fetchCampaignAnalytics(): Promise<CampaignAnalytics[]> {
  const { data, error } = await supabase
    .from("campaign_analytics_view")
    .select("*")
    .order("started_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data || []) as CampaignAnalytics[];
}

export async function fetchCampaignEvents(campaignId: string): Promise<CampaignEvent[]> {
  const { data, error } = await supabase
    .from("campaign_events")
    .select("id, campaign_id, email, event_type, bounce_type, bounce_subtype, click_url, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data || []) as CampaignEvent[];
}

