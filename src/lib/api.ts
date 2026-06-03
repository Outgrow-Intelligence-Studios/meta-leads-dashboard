import { supabase } from "./supabase";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  status: "New" | "Contacted" | "Hot" | "Won" | "Lost";
  created_at: string;
  updated_at: string;
};

const STORAGE_KEY = "meta_leads_apps_script_url";

const DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycbxRXgKzakSG81tw01nw7pRI6hmgCgaJiMFEGmLM0n-aaxl32gsrMkIYl_n0MCn2_XTx/exec";

export function getScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setScriptUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

function toLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? "N/A"),
    source: String(row.source ?? "Landing Page"),
    notes: String(row.notes ?? ""),
    status: (row.status ?? "New") as Lead["status"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toLead);
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
      notes: lead.notes || "",
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
  const { data, error } = await supabase
    .from("leads")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toLead(data as Record<string, unknown>);
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
