import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download01, Plus, SearchLg } from "@untitledui/icons";
import type { Lead } from "../lib/api";
import { addLead, deleteLead, updateLead } from "../lib/api";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { Table, TableCard } from "@/components/application/table/table";
import { TextArea } from "@/components/base/textarea/textarea";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cx } from "@/utils/cx";

type Props = {
  leads: Lead[];
  onChange: (updater: (prev: Lead[]) => Lead[]) => void;
  loading: boolean;
};

const STATUSES = ["New", "Contacted", "Hot", "Won", "Lost"] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadsTable({ leads, onChange, loading }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("today");
  const [sortKey, setSortKey] = useState<"created_at" | "name">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [savingLead, setSavingLead] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Landing Page",
    notes: "",
  });
  const [addingLead, setAddingLead] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = leads.filter((l) => {
      if (statusFilter === "today") {
        const d = new Date(l.created_at);
        return d.toDateString() === new Date().toDateString();
      }
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.source?.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q)
      );
    });
    out = [...out].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = (a.name || "").localeCompare(b.name || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [leads, query, statusFilter, sortKey, sortDir]);

  function toggleSort(key: "created_at" | "name") {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const persistNote = useCallback(async (id: string, note: string) => {
    setSavingLead((s) => ({ ...s, [id]: "note" }));
    try {
      await updateLead(id, { notes: note });
      setToast({ msg: "Note saved.", tone: "ok" });
    } catch (e) {
      setToast({ msg: `Save failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }));
    }
  }, []);

  const changeStatus = useCallback(async (id: string, status: string) => {
    const typedStatus = status as Lead["status"];
    onChange((prev) => prev.map((l) => (l.id === id ? { ...l, status: typedStatus } : l)));
    setSavingLead((s) => ({ ...s, [id]: "status" }));
    try {
      await updateLead(id, { status: typedStatus });
    } catch (e) {
      setToast({ msg: `Status update failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }));
    }
  }, [onChange]);

  const removeLead = useCallback(async (id: string) => {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    setSavingLead((s) => ({ ...s, [id]: "delete" }));
    try {
      await deleteLead(id);
      onChange((prev) => prev.filter((l) => l.id !== id));
      setToast({ msg: "Lead deleted.", tone: "ok" });
    } catch (e) {
      setToast({ msg: `Delete failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }));
    }
  }, [onChange]);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newLead.name || !newLead.email) {
      setToast({ msg: "Name and email are required", tone: "err" });
      return;
    }
    setAddingLead(true);
    try {
      const lead = await addLead(newLead);
      onChange((prev) => [lead as Lead, ...prev]);
      setNewLead({ name: "", email: "", phone: "", source: "Landing Page", notes: "" });
      setShowAddForm(false);
      setToast({ msg: "Lead added successfully", tone: "ok" });
    } catch (e) {
      setToast({ msg: `Add failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setAddingLead(false);
    }
  }

  function exportCsv() {
    const headers = ["Timestamp", "Name", "Email", "Phone", "Source", "Status", "Notes"];
    const rows = filtered.map((l) =>
      [l.created_at, l.name, l.email, l.phone, l.source, l.status, l.notes]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meta-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="All leads"
          badge={filtered.length}
          description="Captured from Meta ad campaigns. Updates sync in real-time."
          contentTrailing={
            <div className="flex flex-wrap items-center gap-2">
              <Input
                size="sm"
                aria-label="Search leads"
                placeholder="Search by name, email, phone..."
                icon={SearchLg}
                value={query}
                onChange={(value) => setQuery(value)}
                className="w-64"
              />
              <Select
                size="sm"
                aria-label="Filter by status"
                placeholder="Status"
                selectedKey={statusFilter === "all" ? undefined : statusFilter}
                onSelectionChange={(key) => setStatusFilter(key as string)}
                className="w-36"
              >
                <SelectItem id="today" label="Today" />
                <SelectItem id="all" label="All statuses" />
                {STATUSES.map((s) => (
                  <SelectItem key={s} id={s} label={s} />
                ))}
              </Select>
              <Button size="sm" color="secondary" iconLeading={Download01} onClick={exportCsv}>
                Export
              </Button>
              <Button size="sm" color="primary" iconLeading={Plus} onClick={() => setShowAddForm(!showAddForm)}>
                Add Lead
              </Button>
            </div>
          }
        />

        {/* Add Lead Form */}
        {showAddForm && (
          <div className="border-b border-secondary bg-secondary px-5 py-4">
            <form onSubmit={handleAddLead} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  label="Name *"
                  placeholder="Enter name"
                  value={newLead.name}
                  onChange={(value) => setNewLead({ ...newLead, name: value })}
                  isRequired
                  isDisabled={addingLead}
                />
                <Input
                  label="Email *"
                  placeholder="Enter email"
                  type="email"
                  value={newLead.email}
                  onChange={(value) => setNewLead({ ...newLead, email: value })}
                  isRequired
                  isDisabled={addingLead}
                />
                <Input
                  label="Phone"
                  placeholder="Enter phone"
                  value={newLead.phone}
                  onChange={(value) => setNewLead({ ...newLead, phone: value })}
                  isDisabled={addingLead}
                />
                <Input
                  label="Source"
                  placeholder="Enter source"
                  value={newLead.source}
                  onChange={(value) => setNewLead({ ...newLead, source: value })}
                  isDisabled={addingLead}
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-end md:gap-3">
                <div className="flex-1">
                  <TextArea
                    label="Notes"
                    placeholder="Add notes..."
                    value={newLead.notes}
                    onChange={(value) => setNewLead({ ...newLead, notes: value })}
                    isDisabled={addingLead}
                  />
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button size="sm" color="secondary" onClick={() => setShowAddForm(false)} isDisabled={addingLead}>
                    Cancel
                  </Button>
                  <Button size="sm" color="primary" isLoading={addingLead} type="submit">
                    {addingLead ? "Adding..." : "Add Lead"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingIndicator size="sm" label="Loading leads..." />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <EmptyState size="sm" className="py-12">
            <EmptyState.FeaturedIcon color="gray" />
            <EmptyState.Content>
              <EmptyState.Title>No leads yet</EmptyState.Title>
              <EmptyState.Description>
                When your Meta ad campaigns generate leads, they&apos;ll appear here.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <Table size="sm" aria-label="Leads table">
            <Table.Header>
              <Table.Head isRowHeader>
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1">
                  Lead
                </button>
              </Table.Head>
              <Table.Head>Contact</Table.Head>
              <Table.Head>Source</Table.Head>
              <Table.Head>
                <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1">
                  Captured
                </button>
              </Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Notes</Table.Head>
              <Table.Head>{""}</Table.Head>
            </Table.Header>
            <Table.Body>
              {filtered.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  saving={savingLead[lead.id] || null}
                  onNoteBlur={persistNote}
                  onStatusChange={changeStatus}
                  onDelete={removeLead}
                />
              ))}
            </Table.Body>
          </Table>
        )}
      </TableCard.Root>

      {/* Toast */}
      {toast && (
        <div
          className={cx(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ring-1 transition-all",
            toast.tone === "ok"
              ? "bg-primary text-utility-green-700 ring-utility-green-200"
              : "bg-primary text-utility-red-700 ring-utility-red-200",
          )}
        >
          <span
            className={cx(
              "h-2 w-2 rounded-full",
              toast.tone === "ok" ? "bg-utility-green-500" : "bg-utility-red-500",
            )}
          />
          {toast.msg}
        </div>
      )}
    </>
  );
}

function LeadRow({
  lead,
  saving,
  onNoteBlur,
  onStatusChange,
  onDelete,
}: {
  lead: Lead;
  saving: string | null;
  onNoteBlur: (id: string, note: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [note, setNote] = useState(lead.notes);
  const initialNote = useRef(lead.notes);

  useEffect(() => {
    setNote(lead.notes);
    initialNote.current = lead.notes;
  }, [lead.notes]);

  function handleBlur() {
    if (note === initialNote.current) return;
    initialNote.current = note;
    onNoteBlur(lead.id, note);
  }

  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex items-center gap-3">
          <Avatar
            size="sm"
            initials={(lead.name || "?")
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-primary truncate">
              {lead.name || "\u2014"}
            </div>
            <div className="text-xs text-tertiary truncate">{lead.email}</div>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="text-sm text-secondary">{lead.phone || "\u2014"}</div>
      </Table.Cell>
      <Table.Cell>
        <Badge color="brand" size="sm" type="pill-color">
          {lead.source || "\u2014"}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <div className="text-sm text-secondary">{formatDate(lead.created_at)}</div>
      </Table.Cell>
      <Table.Cell>
        <select
          value={lead.status || "New"}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={cx(
            "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-focus-ring transition-colors",
            lead.status === "New" && "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
            lead.status === "Contacted" && "bg-utility-yellow-50 text-utility-yellow-700 ring-utility-yellow-200",
            lead.status === "Hot" && "bg-utility-red-50 text-utility-red-700 ring-utility-red-200",
            lead.status === "Won" && "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
            lead.status === "Lost" && "bg-utility-neutral-50 text-utility-neutral-700 ring-utility-neutral-200",
          )}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell>
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleBlur}
            rows={1}
            placeholder="Add a note..."
            className="w-full min-w-[200px] resize-y rounded-md border border-transparent bg-secondary px-2.5 py-1.5 text-sm text-primary placeholder-placeholder hover:border-primary focus:border-brand focus:bg-primary focus:outline-none focus:ring-2 focus:ring-focus-ring transition-colors"
          />
          {saving === "note" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <button
          onClick={() => onDelete(lead.id)}
          className="rounded-md p-1.5 text-fg-quaternary hover:bg-utility-red-50 hover:text-utility-red-600 transition-colors"
          title="Delete lead"
          disabled={saving === "delete"}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
        </button>
      </Table.Cell>
    </Table.Row>
  );
}
