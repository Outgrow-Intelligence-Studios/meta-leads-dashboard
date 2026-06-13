import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy01, ChevronLeft, ChevronRight, Download01, Plus, SearchLg } from "@untitledui/icons";
import type { Lead } from "../lib/api";
import { addLead, deleteLead, updateLead } from "../lib/api";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CheckboxBase } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { Table, TableCard } from "@/components/application/table/table";
import { TextArea } from "@/components/base/textarea/textarea";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cx } from "@/utils/cx";

type Props = {
  leads: Lead[];
  onChange: (updater: (prev: Lead[]) => Lead[]) => void;
  loading: boolean;
};

const STATUSES = ["New", "Contacted", "Hot", "Won", "Lost"] as const;
const CELL_INPUT_CLASS =
  "w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs outline-none transition-all placeholder:text-placeholder hover:border-primary focus:border-brand focus:ring-4 focus:ring-brand/12";
const CELL_TEXTAREA_CLASS =
  "w-full min-w-[220px] resize-none rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs outline-none transition-all placeholder:text-placeholder hover:border-primary focus:border-brand focus:ring-4 focus:ring-brand/12";
const STICKY_DATE_CLASS = "sticky left-0 z-10 bg-primary shadow-[1px_0_0_0_rgba(16,24,40,0.06)]";
const STICKY_NAME_CLASS = "sticky left-[150px] z-10 bg-primary shadow-[1px_0_0_0_rgba(16,24,40,0.06)]";
const SOURCE_PILL_CLASS =
  "inline-flex items-center rounded-md border border-secondary bg-secondary px-2.5 py-1 text-xs font-medium text-secondary";

function getStatusClass(status: Lead["status"]) {
  if (status === "New") return "text-utility-blue-700 ring-utility-blue-200 bg-utility-blue-50";
  if (status === "Contacted") return "text-utility-yellow-700 ring-utility-yellow-200 bg-utility-yellow-50";
  if (status === "Hot") return "text-utility-red-700 ring-utility-red-200 bg-utility-red-50";
  if (status === "Won") return "text-utility-green-700 ring-utility-green-200 bg-utility-green-50";
  return "text-fg-quaternary ring-border-secondary bg-primary";
}

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

function formatShortDate(iso: string | null) {
  if (!iso) return "No date";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cx("h-3.5 rounded bg-secondary/80 animate-pulse", className)} />;
}

function LeadsTableSkeleton() {
  return (
    <div className="overflow-x-auto bg-primary">
      <div className="min-w-[1940px]">
        <div className="grid grid-cols-[48px_150px_180px_220px_140px_150px_160px_180px_240px_170px_170px_180px_180px_180px_40px] border-b border-secondary bg-primary/95 px-5 py-3">
          {["", "Created", "Lead", "Email", "Phone", "Source", "Lead Status", "Region", "Notes", "Next Follow-Up", "Final Follow-Up", "Owner", "Note 1", "Note 2", ""].map((label, index) => (
            <div key={`${label}-${index}`} className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">
              {label}
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[48px_150px_180px_220px_140px_150px_160px_180px_240px_170px_170px_180px_180px_180px_40px] items-start border-b border-secondary px-5 py-4"
          >
            <SkeletonBar className="mt-1 h-5 w-5 rounded-md" />
            <div className="space-y-2">
              <SkeletonBar className="w-20" />
              <SkeletonBar className="w-28" />
            </div>
            <div className="space-y-2">
              <SkeletonBar className="w-24" />
              <SkeletonBar className="w-16" />
            </div>
            <SkeletonBar className="w-40" />
            <SkeletonBar className="w-24" />
            <SkeletonBar className="h-7 w-24 rounded-md" />
            <SkeletonBar className="h-9 w-full rounded-lg" />
            <SkeletonBar className="h-9 w-full rounded-lg" />
            <SkeletonBar className="h-14 w-full rounded-lg" />
            <SkeletonBar className="h-9 w-full rounded-lg" />
            <SkeletonBar className="h-9 w-full rounded-lg" />
            <SkeletonBar className="h-9 w-full rounded-lg" />
            <SkeletonBar className="h-9 w-full rounded-lg" />
            <SkeletonBar className="h-9 w-full rounded-lg" />
            <SkeletonBar className="mt-1 h-5 w-5 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectionToggle({
  checked,
  indeterminate = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
    >
      <CheckboxBase size="md" isSelected={checked} isIndeterminate={indeterminate} />
    </button>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  position = "bottom",
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  position?: "top" | "bottom";
}) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const borderClass = position === "top" ? "border-b border-secondary" : "border-t border-secondary";

  return (
    <div className={cx("flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3 bg-primary", borderClass)}>
      <div className="text-xs text-tertiary">
        Showing <span className="font-semibold text-primary">{totalItems === 0 ? 0 : startItem}</span> to{" "}
        <span className="font-semibold text-primary">{endItem}</span> of{" "}
        <span className="font-semibold text-primary">{totalItems}</span> leads
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          color="secondary"
          isDisabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          iconLeading={ChevronLeft}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (page > 3 && totalPages > 5) {
              pageNum = page - 3 + i;
              if (pageNum + (4 - i) > totalPages) {
                pageNum = totalPages - 4 + i;
              }
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cx(
                  "size-7 text-xs font-semibold rounded-md border transition-all",
                  page === pageNum
                    ? "bg-[#ed1c24]/10 border-[#ed1c24] text-[#ed1c24]"
                    : "bg-primary border-secondary text-tertiary hover:bg-secondary hover:text-primary"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <Button
          size="xs"
          color="secondary"
          isDisabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          iconTrailing={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function LeadsTable({ leads, onChange, loading }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"created_at" | "name">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [savingLead, setSavingLead] = useState<Record<string, string | null>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  useEffect(() => {
    setSelectedLeadIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => leads.some((lead) => lead.id === id)));
      return next.size === prev.size ? prev : next;
    });
  }, [leads]);

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
        l.notes?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.sales_person?.toLowerCase().includes(q) ||
        l.remark_1?.toLowerCase().includes(q) ||
        l.remark_2?.toLowerCase().includes(q)
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

  const persistCrmFields = useCallback(async (
    lead: Lead,
    updates: Partial<Pick<Lead, "notes" | "location" | "sales_person" | "remark_1" | "remark_2">>,
    savingKey: "notes" | "location" | "sales_person" | "remark_1" | "remark_2",
    successMessage: string,
  ) => {
    const nextLead = { ...lead, ...updates };
    onChange((prev) => prev.map((item) => (item.id === lead.id ? nextLead : item)));
    setSavingLead((s) => ({ ...s, [lead.id]: savingKey }));
    try {
      await updateLead(lead.id, {
        notes: nextLead.notes,
        location: nextLead.location,
        sales_person: nextLead.sales_person,
        remark_1: nextLead.remark_1,
        remark_2: nextLead.remark_2,
      });
      setToast({ msg: successMessage, tone: "ok" });
    } catch (e) {
      setToast({ msg: `Save failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [lead.id]: null }));
    }
  }, [onChange]);

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

  const changeFollowUp = useCallback(async (id: string, date: string) => {
    onChange((prev) => prev.map((l) => (l.id === id ? { ...l, follow_up: date || null } : l)));
    setSavingLead((s) => ({ ...s, [id]: "follow_up" }));
    try {
      await updateLead(id, { follow_up: date || null });
      setToast({ msg: "Follow up 1 saved.", tone: "ok" });
    } catch (e) {
      setToast({ msg: `Follow up 1 failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }));
    }
  }, [onChange]);

  const changeFollowUp2 = useCallback(async (id: string, date: string) => {
    onChange((prev) => prev.map((l) => (l.id === id ? { ...l, follow_up_2: date || null } : l)));
    setSavingLead((s) => ({ ...s, [id]: "follow_up_2" }));
    try {
      await updateLead(id, { follow_up_2: date || null });
      setToast({ msg: "Follow up 2 saved.", tone: "ok" });
    } catch (e) {
      setToast({ msg: `Follow up 2 failed: ${(e as Error).message}`, tone: "err" });
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

  function exportCsv(rowsToExport = filtered) {
    const headers = [
      "Created",
      "Lead",
      "Email",
      "Phone",
      "Source",
      "Lead Status",
      "Region",
      "Notes",
      "Next Follow-Up",
      "Final Follow-Up",
      "Owner",
      "Note 1",
      "Note 2",
    ];
    const rows = rowsToExport.map((l) =>
      [
        l.created_at,
        l.name,
        l.email,
        l.phone,
        l.source,
        l.status,
        l.location,
        l.notes,
        l.follow_up || "",
        l.follow_up_2 || "",
        l.sales_person,
        l.remark_1,
        l.remark_2,
      ]
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

  const handleCopyLead = useCallback((lead: Lead) => {
    const lines = [];
    lines.push(`📋 *Meta Lead Details*`);
    if (lead.name) lines.push(`👤 *Name:* ${lead.name}`);
    if (lead.phone) lines.push(`📞 *Phone:* ${lead.phone}`);
    if (lead.email) lines.push(`✉️ *Email:* ${lead.email}`);
    if (lead.source) lines.push(`🌐 *Source:* ${lead.source}`);
    if (lead.status) lines.push(`🏷️ *Status:* ${lead.status}`);
    if (lead.created_at) lines.push(`📅 *Created:* ${new Date(lead.created_at).toLocaleDateString()}`);
    if (lead.location) lines.push(`📍 *Region:* ${lead.location}`);
    if (lead.sales_person) lines.push(`💼 *Owner:* ${lead.sales_person}`);
    if (lead.notes) lines.push(`📝 *Notes:* ${lead.notes}`);
    if (lead.remark_1) lines.push(`📌 *Note 1:* ${lead.remark_1}`);
    if (lead.remark_2) lines.push(`📌 *Note 2:* ${lead.remark_2}`);

    const textToCopy = lines.join("\n");
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setToast({ msg: `Lead details copied to clipboard!`, tone: "ok" });
      })
      .catch((err) => {
        setToast({ msg: `Failed to copy: ${err}`, tone: "err" });
      });
  }, []);

  const totalItems = filtered.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const paginatedLeads = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const selectedLeads = useMemo(
    () => filtered.filter((lead) => selectedLeadIds.has(lead.id)),
    [filtered, selectedLeadIds],
  );

  const allVisibleSelected = paginatedLeads.length > 0 && paginatedLeads.every((lead) => selectedLeadIds.has(lead.id));
  const someVisibleSelected = paginatedLeads.some((lead) => selectedLeadIds.has(lead.id));

  function toggleVisibleSelection(checked: boolean) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (checked) paginatedLeads.forEach((lead) => next.add(lead.id));
      else paginatedLeads.forEach((lead) => next.delete(lead.id));
      return next;
    });
  }

  function toggleLeadSelection(id: string, checked: boolean) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function bulkDeleteSelected() {
    if (selectedLeads.length === 0) return;
    if (!confirm(`Delete ${selectedLeads.length} selected lead${selectedLeads.length === 1 ? "" : "s"}? This cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      for (const lead of selectedLeads) {
        await deleteLead(lead.id);
      }
      const selectedIdSet = new Set(selectedLeads.map((lead) => lead.id));
      onChange((prev) => prev.filter((lead) => !selectedIdSet.has(lead.id)));
      setSelectedLeadIds(new Set());
      setToast({ msg: `${selectedLeads.length} lead${selectedLeads.length === 1 ? "" : "s"} deleted.`, tone: "ok" });
    } catch (e) {
      setToast({ msg: `Bulk delete failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <>
      <TableCard.Root className="overflow-hidden bg-primary ring-1 ring-secondary shadow-sm">
        <TableCard.Header
          title="All leads"
          badge={filtered.length}
          contentTrailing={
            <div className="flex flex-wrap items-center gap-2">
              <Input
                size="sm"
                aria-label="Search leads"
                placeholder="Search leads..."
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

        {selectedLeadIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary bg-secondary px-5 py-3">
            <div className="text-sm font-medium text-primary">
              {selectedLeadIds.size} selected
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                color="secondary"
                onClick={() => exportCsv(selectedLeads)}
              >
                Export selected
              </Button>
              <Button
                size="sm"
                color="secondary-destructive"
                isLoading={bulkDeleting}
                onClick={bulkDeleteSelected}
              >
                Delete selected
              </Button>
            </div>
          </div>
        )}

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
        {loading && <LeadsTableSkeleton />}

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

        {/* Pagination controls top */}
        {!loading && filtered.length > 0 && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            position="top"
          />
        )}

        {/* Table — scrollable, no row shrinking */}
        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto bg-primary">
            <Table size="sm" aria-label="Leads table" className="min-w-[1940px] table-striped-columns">
              <Table.Header className="bg-primary/95 backdrop-blur-sm">
                <Table.Head className="w-12 bg-primary/95">
                  <SelectionToggle
                    label="Select all visible leads"
                    checked={allVisibleSelected}
                    indeterminate={!allVisibleSelected && someVisibleSelected}
                    onChange={toggleVisibleSelection}
                  />
                </Table.Head>
                <Table.Head className={cx("min-w-[150px] bg-primary/95", STICKY_DATE_CLASS)}>
                  <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">
                    Created
                  </button>
                </Table.Head>
                <Table.Head isRowHeader className={cx("min-w-[180px] bg-primary/95", STICKY_NAME_CLASS)}>
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">
                    Lead
                  </button>
                </Table.Head>
                <Table.Head className="min-w-[220px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Email</Table.Head>
                <Table.Head className="min-w-[140px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Phone</Table.Head>
                <Table.Head className="min-w-[150px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Source</Table.Head>
                <Table.Head className="min-w-[160px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Lead Status</Table.Head>
                <Table.Head className="min-w-[180px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Region</Table.Head>
                <Table.Head className="min-w-[240px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Notes</Table.Head>
                <Table.Head className="min-w-[170px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Next Follow-Up</Table.Head>
                <Table.Head className="min-w-[170px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Final Follow-Up</Table.Head>
                <Table.Head className="min-w-[180px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Owner</Table.Head>
                <Table.Head className="min-w-[180px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Note 1</Table.Head>
                <Table.Head className="min-w-[180px] text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Note 2</Table.Head>
                <Table.Head className="w-10 bg-primary/95">{""}</Table.Head>
              </Table.Header>
              <Table.Body>
                {paginatedLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    saving={savingLead[lead.id] || null}
                    isSelected={selectedLeadIds.has(lead.id)}
                    onCrmFieldSave={persistCrmFields}
                    onSelectionChange={toggleLeadSelection}
                    onStatusChange={changeStatus}
                    onFollowUpChange={changeFollowUp}
                    onFollowUp2Change={changeFollowUp2}
                    onDelete={removeLead}
                    onCopy={handleCopyLead}
                  />
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {/* Pagination controls bottom */}
        {!loading && filtered.length > 0 && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            position="bottom"
          />
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
  isSelected,
  onCrmFieldSave,
  onSelectionChange,
  onStatusChange,
  onFollowUpChange,
  onFollowUp2Change,
  onDelete,
  onCopy,
}: {
  lead: Lead;
  saving: string | null;
  isSelected: boolean;
  onCrmFieldSave: (
    lead: Lead,
    updates: Partial<Pick<Lead, "notes" | "location" | "sales_person" | "remark_1" | "remark_2">>,
    savingKey: "notes" | "location" | "sales_person" | "remark_1" | "remark_2",
    successMessage: string,
  ) => void;
  onSelectionChange: (id: string, checked: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onFollowUpChange: (id: string, date: string) => void;
  onFollowUp2Change: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onCopy: (lead: Lead) => void;
}) {
  const [draft, setDraft] = useState({
    notes: lead.notes,
    location: lead.location,
    sales_person: lead.sales_person,
    remark_1: lead.remark_1,
    remark_2: lead.remark_2,
  });
  const initialDraft = useRef(draft);

  useEffect(() => {
    const nextDraft = {
      notes: lead.notes,
      location: lead.location,
      sales_person: lead.sales_person,
      remark_1: lead.remark_1,
      remark_2: lead.remark_2,
    };
    setDraft(nextDraft);
    initialDraft.current = nextDraft;
  }, [lead.location, lead.notes, lead.remark_1, lead.remark_2, lead.sales_person]);

  function handleFieldBlur(
    field: "notes" | "location" | "sales_person" | "remark_1" | "remark_2",
    successMessage: string,
  ) {
    if (draft[field] === initialDraft.current[field]) return;
    const value = draft[field];
    initialDraft.current = { ...initialDraft.current, [field]: value };
    onCrmFieldSave(lead, { [field]: value }, field, successMessage);
  }

  return (
    <Table.Row className="h-auto bg-primary align-top hover:bg-secondary/40">
      <Table.Cell className="align-top">
        <SelectionToggle
          label={`Select ${lead.name || "lead"}`}
          checked={isSelected}
          onChange={(checked) => onSelectionChange(lead.id, checked)}
        />
      </Table.Cell>
      <Table.Cell className={cx("align-top", STICKY_DATE_CLASS)}>
        <div className="space-y-1">
          <div className="text-sm font-medium text-primary">{formatShortDate(lead.created_at)}</div>
          <div className="text-xs text-tertiary">{formatDate(lead.created_at)}</div>
        </div>
      </Table.Cell>
      <Table.Cell className={cx("align-top", STICKY_NAME_CLASS)}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="text-sm font-semibold text-primary truncate">{lead.name || "\u2014"}</div>
            <div className="text-xs text-tertiary">Contact record</div>
          </div>
          <button
            onClick={() => onCopy(lead)}
            title="Copy lead details to clipboard"
            className="p-1 rounded text-tertiary hover:text-[#ed1c24] hover:bg-[#ed1c24]/5 transition-all cursor-pointer shrink-0 mt-0.5"
          >
            <Copy01 className="size-3.5" />
          </button>
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="max-w-[220px] truncate text-sm text-secondary">{lead.email || "\u2014"}</div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="text-sm text-secondary">{lead.phone || "\u2014"}</div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <span className={SOURCE_PILL_CLASS}>{lead.source || "\u2014"}</span>
      </Table.Cell>
      <Table.Cell className="align-top">
        <select
          value={lead.status || "New"}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={cx(
            "w-full cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium shadow-xs outline-none transition-all focus:ring-4 focus:ring-brand/12",
            getStatusClass(lead.status),
          )}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="relative">
          <input
            type="text"
            value={draft.location}
            onChange={(e) => setDraft((current) => ({ ...current, location: e.target.value }))}
            onBlur={() => handleFieldBlur("location", "Region saved.")}
            placeholder="Add region"
            className={CELL_INPUT_CLASS}
          />
          {saving === "location" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="relative">
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))}
            onBlur={() => handleFieldBlur("notes", "Notes saved.")}
            rows={2}
            placeholder="Add notes..."
            className={CELL_TEXTAREA_CLASS}
          />
          {saving === "notes" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="relative">
          <input
            type="date"
            value={lead.follow_up || ""}
            onChange={(e) => onFollowUpChange(lead.id, e.target.value)}
            className={CELL_INPUT_CLASS}
          />
          <div className="mt-1 text-xs text-tertiary">{formatShortDate(lead.follow_up)}</div>
          {saving === "follow_up" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="relative">
          <input
            type="date"
            value={lead.follow_up_2 || ""}
            onChange={(e) => onFollowUp2Change(lead.id, e.target.value)}
            className={CELL_INPUT_CLASS}
          />
          <div className="mt-1 text-xs text-tertiary">{formatShortDate(lead.follow_up_2)}</div>
          {saving === "follow_up_2" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="relative">
          <input
            type="text"
            value={draft.sales_person}
            onChange={(e) => setDraft((current) => ({ ...current, sales_person: e.target.value }))}
            onBlur={() => handleFieldBlur("sales_person", "Owner saved.")}
            placeholder="Assign owner"
            className={CELL_INPUT_CLASS}
          />
          {saving === "sales_person" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="relative">
          <input
            type="text"
            value={draft.remark_1}
            onChange={(e) => setDraft((current) => ({ ...current, remark_1: e.target.value }))}
            onBlur={() => handleFieldBlur("remark_1", "Note 1 saved.")}
            placeholder="Add note"
            className={CELL_INPUT_CLASS}
          />
          {saving === "remark_1" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <div className="relative">
          <input
            type="text"
            value={draft.remark_2}
            onChange={(e) => setDraft((current) => ({ ...current, remark_2: e.target.value }))}
            onBlur={() => handleFieldBlur("remark_2", "Note 2 saved.")}
            placeholder="Add note"
            className={CELL_INPUT_CLASS}
          />
          {saving === "remark_2" && (
            <span className="absolute -top-1 right-1 text-[10px] text-brand">saving...</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="align-top">
        <button
          onClick={() => onDelete(lead.id)}
          className="rounded-lg p-2 text-fg-quaternary transition-colors hover:bg-utility-red-50 hover:text-utility-red-600"
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
