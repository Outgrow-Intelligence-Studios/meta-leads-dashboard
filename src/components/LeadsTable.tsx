import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, Copy01, ChevronLeft, ChevronRight, Download01, Plus, SearchLg, Trash01, X } from "@untitledui/icons";
import type { Lead } from "../lib/api";
import { addLead, deleteLead, updateLead } from "../lib/api";
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

const STATUSES = ["New", "Contacted", "Hot", "Won", "Lost", "No Ans"] as const;
const KNOWN_OWNERS = [
  "Abhay Shankar",
  "Ravi Purohit",
  "Dipaya",
  "Rahul Shukla",
  "Sarah Redkar",
  "Ankur Sharma",
  "Ram Jadhav",
  "Bala Balaji Nagalla",
  "Madan Raj",
  "Balanagaraj",
  "Archana",
  "Hiren Gurjar"
] as const;
const CELL_INPUT_CLASS =
  "w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs outline-none transition-all placeholder:text-placeholder hover:border-primary focus:border-brand focus:ring-4 focus:ring-brand/12";
const CELL_TEXTAREA_CLASS =
  "w-full min-w-[220px] resize-none rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs outline-none transition-all placeholder:text-placeholder hover:border-primary focus:border-brand focus:ring-4 focus:ring-brand/12";
const SOURCE_PILL_CLASS =
  "inline-flex items-center rounded-md border border-secondary bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary";

function getStatusClass(status: Lead["status"]) {
  if (status === "New") return "text-utility-blue-700 ring-utility-blue-200 bg-utility-blue-50";
  if (status === "Contacted") return "text-utility-yellow-700 ring-utility-yellow-200 bg-utility-yellow-50";
  if (status === "Hot") return "text-utility-red-700 ring-utility-red-200 bg-utility-red-50";
  if (status === "Won") return "text-utility-green-700 ring-utility-green-200 bg-utility-green-50";
  if (status === "No Ans") return "text-utility-neutral-700 ring-utility-neutral-200 bg-utility-neutral-50";
  return "text-fg-quaternary ring-border-secondary bg-primary";
}

function getAdSourceClass(adSource: string) {
  if (adSource === "Meta Ads") return "text-utility-blue-700 ring-utility-blue-200 bg-utility-blue-50";
  if (adSource === "Google Ads") return "text-utility-green-700 ring-utility-green-200 bg-utility-green-50";
  return "text-utility-neutral-700 ring-utility-neutral-200 bg-utility-neutral-50";
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

const getRowBgClass = (selected: boolean) =>
  selected ? "bg-[#fef3f2] hover:bg-[#fee4e2]" : "bg-primary hover:bg-secondary/40";

const getCellBgClass = (selected: boolean, isSticky: boolean) => {
  if (selected) {
    return "!bg-[#fef3f2] group-hover:!bg-[#fee4e2]";
  }
  if (isSticky) {
    return "bg-primary group-hover:!bg-secondary/40";
  }
  return "group-hover:!bg-secondary/40";
};

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cx("h-3.5 rounded bg-secondary/80 animate-pulse", className)} />;
}

function LeadsTableSkeleton() {
  return (
    <div className="overflow-hidden w-full bg-primary">
      <div className="min-w-0 w-full">
        <div className="grid grid-cols-[40px_100px_1fr_110px_110px_110px_1fr_1fr_110px_100px] border-b border-secondary bg-[#101828] px-2 py-3">
          {["", "Created", "Lead", "Phone", "Source", "Status", "Region", "Owner", "Followup", ""].map((label, index) => (
            <div key={`${label}-${index}`} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              {label}
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[40px_100px_1fr_110px_110px_110px_1fr_1fr_110px_100px] items-center border-b border-secondary px-2 py-4"
          >
            <SkeletonBar className="mt-1 h-5 w-5 rounded-md" />
            <div className="space-y-1.5">
              <SkeletonBar className="w-16" />
              <SkeletonBar className="w-20" />
            </div>
            <SkeletonBar className="w-24" />
            <SkeletonBar className="w-20" />
            <SkeletonBar className="h-6 w-16 rounded-md" />
            <SkeletonBar className="h-8 w-24 rounded-lg" />
            <SkeletonBar className="w-20" />
            <SkeletonBar className="w-20" />
            <SkeletonBar className="w-16" />
            <div className="flex justify-end">
              <SkeletonBar className="h-7 w-20 rounded-lg" />
            </div>
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
  onPageSizeChange,
  position = "bottom",
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (size: number) => void;
  position?: "top" | "bottom";
}) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const borderClass = position === "top" ? "border-b border-secondary" : "border-t border-secondary";

  return (
    <div className={cx("flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3 bg-primary", borderClass)}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-xs text-tertiary">
          Showing <span className="font-semibold text-primary">{totalItems === 0 ? 0 : startItem}</span> to{" "}
          <span className="font-semibold text-primary">{endItem}</span> of{" "}
          <span className="font-semibold text-primary">{totalItems}</span> leads
        </div>
        {onPageSizeChange && (
          <div className="flex items-center gap-2 sm:border-l sm:border-secondary sm:pl-4">
            <span className="text-xs text-tertiary">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-secondary bg-primary px-2 py-1 text-xs font-semibold text-primary shadow-xs outline-none transition-all hover:border-primary focus:border-brand cursor-pointer"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          color="secondary"
          isDisabled={page === 1}
          onPress={() => onPageChange(page - 1)}
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
          onPress={() => onPageChange(page + 1)}
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
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const currentDetailsLead = useMemo(() => {
    if (!selectedLeadForDetails) return null;
    return leads.find((l) => l.id === selectedLeadForDetails.id) || selectedLeadForDetails;
  }, [leads, selectedLeadForDetails]);

  const OWNERS = useMemo(() => {
    const dataOwners = leads
      .map((l) => (l.sales_person || "").trim())
      .filter(Boolean);
    const unique = [...new Set([...KNOWN_OWNERS, ...dataOwners])].sort();
    return unique;
  }, [leads]);

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
    updates: Partial<Lead>,
    savingKey: keyof Lead,
    successMessage: string,
  ) => {
    const nextLead = { ...lead, ...updates };
    onChange((prev) => prev.map((item) => (item.id === lead.id ? nextLead : item)));
    setSavingLead((s) => ({ ...s, [lead.id]: savingKey as string }));
    try {
      const savedLead = await updateLead(lead.id, updates, lead);
      onChange((prev) => prev.map((item) => (item.id === lead.id ? savedLead : item)));
      setToast({ msg: successMessage, tone: "ok" });
    } catch (e) {
      setToast({ msg: `Save failed: ${(e as Error).message}`, tone: "err" });
      onChange((prev) => prev.map((item) => (item.id === lead.id ? lead : item)));
    } finally {
      setSavingLead((s) => ({ ...s, [lead.id]: null }));
    }
  }, [onChange]);

  const changeStatus = useCallback(async (id: string, status: string) => {
    const typedStatus = status as Lead["status"];
    const lead = leads.find((l) => l.id === id);
    onChange((prev) => prev.map((l) => (l.id === id ? { ...l, status: typedStatus } : l)));
    setSavingLead((s) => ({ ...s, [id]: "status" }));
    try {
      const savedLead = await updateLead(id, { status: typedStatus }, lead);
      onChange((prev) => prev.map((l) => (l.id === id ? savedLead : l)));
    } catch (e) {
      setToast({ msg: `Status update failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }));
    }
  }, [onChange, leads]);

  const changeFollowUp = useCallback(async (id: string, date: string) => {
    const lead = leads.find((l) => l.id === id);
    onChange((prev) => prev.map((l) => (l.id === id ? { ...l, follow_up: date || null } : l)));
    setSavingLead((s) => ({ ...s, [id]: "follow_up" }));
    try {
      const savedLead = await updateLead(id, { follow_up: date || null }, lead);
      onChange((prev) => prev.map((l) => (l.id === id ? savedLead : l)));
      setToast({ msg: "Follow up 1 saved.", tone: "ok" });
    } catch (e) {
      setToast({ msg: `Follow up 1 failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }));
    }
  }, [onChange, leads]);

  const changeFollowUp2 = useCallback(async (id: string, date: string) => {
    const lead = leads.find((l) => l.id === id);
    onChange((prev) => prev.map((l) => (l.id === id ? { ...l, follow_up_2: date || null } : l)));
    setSavingLead((s) => ({ ...s, [id]: "follow_up_2" }));
    try {
      const savedLead = await updateLead(id, { follow_up_2: date || null }, lead);
      onChange((prev) => prev.map((l) => (l.id === id ? savedLead : l)));
      setToast({ msg: "Follow up 2 saved.", tone: "ok" });
    } catch (e) {
      setToast({ msg: `Follow up 2 failed: ${(e as Error).message}`, tone: "err" });
    } finally {
      setSavingLead((s) => ({ ...s, [id]: null }));
    }
  }, [onChange, leads]);

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
    setToast({ msg: "Exporting CSV...", tone: "ok" });
    try {
      const BOM = "\uFEFF";
      const headers = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "Source",
        "Ad Source",
        "Status",
        "City",
        "Notes",
        "Follow-Up 1",
        "Follow-Up 2",
        "Owner",
        "Remark 1",
        "Remark 2",
        "Created At",
        "Updated At",
      ];

      function cleanSimpleText(value: unknown): string {
        let str = String(value ?? "");
        return str.replace(/[\r\n]+/g, " ").trim();
      }

      function cleanMetadataText(value: unknown): string {
        let str = String(value ?? "");
        str = str.replace(/[\r\n]+/g, " ").trim();
        const parts = str.split(" | ");
        // Deduplicate pipe-separated segments
        const seen = new Set<string>();
        const deduped = parts.filter((p) => {
          const t = p.trim();
          if (!t || seen.has(t)) return false;
          seen.add(t);
          return true;
        });
        return deduped.join(" | ");
      }

      function escapeCsvField(value: unknown): string {
        const str = String(value ?? "");
        const hasSpecialChars = str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r");
        if (hasSpecialChars) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }

      const rows = rowsToExport.map((l) =>
        [
          l.id,
          cleanSimpleText(l.name),
          l.email,
          l.phone,
          cleanSimpleText(l.source),
          cleanSimpleText(l.ad_source || ""),
          l.status,
          cleanSimpleText(l.location),
          cleanMetadataText(l.notes),
          l.follow_up || "",
          l.follow_up_2 || "",
          cleanSimpleText(l.sales_person),
          cleanMetadataText(l.remark_1),
          cleanMetadataText(l.remark_2),
          l.created_at,
          l.updated_at,
        ]
          .map(escapeCsvField)
          .join(",")
      );

      const csvContent = BOM + [headers.map(escapeCsvField).join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meta-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ msg: "CSV exported successfully", tone: "ok" });
    } catch (e) {
      console.error(e);
      setToast({ msg: `Export failed: ${(e as Error).message}`, tone: "err" });
    }
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
              <Button size="sm" color="primary" iconLeading={Plus} onPress={() => setShowAddForm(!showAddForm)}>
                Add Lead
              </Button>
            </div>
          }
        />

        {selectedLeadIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-primary/95 backdrop-blur-md border border-secondary shadow-2xl rounded-2xl px-6 py-3.5 animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ed1c24]/10 text-[11px] font-semibold text-[#ed1c24]">
                {selectedLeadIds.size}
              </span>
              <span className="text-xs font-semibold text-primary">selected</span>
            </div>
            
            <div className="h-4 w-px bg-secondary" />

            <div className="flex items-center gap-2">
              <Button
                size="xs"
                color="secondary"
                iconLeading={CheckCircle}
                onPress={() => {
                  const next = new Set<string>();
                  filtered.forEach(l => next.add(l.id));
                  setSelectedLeadIds(next);
                }}
              >
                Select All ({filtered.length})
              </Button>

              <Button
                size="xs"
                color="secondary"
                iconLeading={X}
                onPress={() => setSelectedLeadIds(new Set())}
              >
                Deselect All
              </Button>

              <Button
                size="xs"
                color="secondary"
                iconLeading={Download01}
                onPress={() => exportCsv(selectedLeads)}
              >
                Export
              </Button>

              <Button
                size="xs"
                color="primary-destructive"
                iconLeading={Trash01}
                isLoading={bulkDeleting}
                onPress={bulkDeleteSelected}
              >
                Delete
              </Button>
            </div>

            <div className="h-4 w-px bg-secondary" />

            <button
              onClick={() => setSelectedLeadIds(new Set())}
              title="Cancel selection"
              className="p-1 rounded text-tertiary hover:text-primary hover:bg-secondary transition-all cursor-pointer"
            >
              <X className="size-4" />
            </button>
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
                  <Button size="sm" color="secondary" onPress={() => setShowAddForm(false)} isDisabled={addingLead}>
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
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            position="top"
          />
        )}

        {/* Table — fluid screen width, no horizontal scroll */}
        {!loading && filtered.length > 0 && (
          <div className="overflow-hidden w-full bg-primary">
            <Table size="sm" aria-label="Leads table" className="w-full table-striped-columns">
              <Table.Header className="bg-[#101828] text-white border-b border-[#101828]">
                <Table.Head className="w-10 bg-[#101828] px-2 text-white">
                  <SelectionToggle
                    label="Select all visible leads"
                    checked={allVisibleSelected}
                    indeterminate={!allVisibleSelected && someVisibleSelected}
                    onChange={toggleVisibleSelection}
                  />
                </Table.Head>
                <Table.Head className="w-[100px] bg-[#101828] px-2 text-white">
                  <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white cursor-pointer">
                    Created
                  </button>
                </Table.Head>
                <Table.Head isRowHeader className="bg-[#101828] px-2 text-white">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white cursor-pointer">
                    Lead
                  </button>
                </Table.Head>
                <Table.Head className="w-[110px] px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white bg-[#101828]">Phone</Table.Head>
                <Table.Head className="w-[110px] px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white bg-[#101828]">Source</Table.Head>
                <Table.Head className="w-[110px] px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white bg-[#101828]">Ad Source</Table.Head>
                <Table.Head className="w-[130px] min-w-[130px] px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white bg-[#101828]">Status</Table.Head>
                <Table.Head className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white bg-[#101828]">Region</Table.Head>
                <Table.Head className="w-[160px] min-w-[160px] px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white bg-[#101828]">Owner</Table.Head>
                <Table.Head className="w-[110px] px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white bg-[#101828]">Followup</Table.Head>
                <Table.Head className="w-[100px] bg-[#101828] px-2 text-right">{""}</Table.Head>
              </Table.Header>
              <Table.Body>
                {paginatedLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLeadIds.has(lead.id)}
                    owners={OWNERS}
                    onSelectionChange={toggleLeadSelection}
                    onStatusChange={changeStatus}
                    onCrmFieldSave={persistCrmFields}
                    onCopy={handleCopyLead}
                    onOpenDetails={setSelectedLeadForDetails}
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
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            position="bottom"
          />
        )}
      </TableCard.Root>

      {currentDetailsLead && (
        <LeadDetailsDrawer
          lead={currentDetailsLead}
          saving={savingLead[currentDetailsLead.id] || null}
          owners={OWNERS}
          onClose={() => setSelectedLeadForDetails(null)}
          onCrmFieldSave={persistCrmFields}
          onStatusChange={changeStatus}
          onFollowUpChange={changeFollowUp}
          onFollowUp2Change={changeFollowUp2}
          onCopy={handleCopyLead}
          onDelete={removeLead}
        />
      )}

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
  isSelected,
  owners,
  onSelectionChange,
  onStatusChange,
  onCrmFieldSave,
  onCopy,
  onOpenDetails,
}: {
  lead: Lead;
  isSelected: boolean;
  owners: string[];
  onSelectionChange: (id: string, checked: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onCrmFieldSave: (lead: Lead, updates: Partial<Lead>, key: keyof Lead, msg: string) => void;
  onCopy: (lead: Lead) => void;
  onOpenDetails: (lead: Lead) => void;
}) {
  return (
    <Table.Row className={cx("group h-auto align-middle", getRowBgClass(isSelected))}>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        <SelectionToggle
          label={`Select ${lead.name || "lead"}`}
          checked={isSelected}
          onChange={(checked) => onSelectionChange(lead.id, checked)}
        />
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        <div className="text-xs font-medium text-primary whitespace-nowrap">{formatShortDate(lead.created_at)}</div>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="text-xs font-semibold text-primary truncate">{lead.name || "\u2014"}</div>
          <button
            onClick={() => onCopy(lead)}
            title="Copy lead details to clipboard"
            className="p-1 rounded text-tertiary hover:text-[#ed1c24] hover:bg-[#ed1c24]/5 transition-all cursor-pointer shrink-0"
          >
            <Copy01 className="size-3.5" />
          </button>
        </div>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        <div className="text-xs text-secondary truncate">{lead.phone || "\u2014"}</div>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        <span className={cx(SOURCE_PILL_CLASS, "truncate max-w-full block text-center")}>{lead.source || "\u2014"}</span>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        {lead.ad_source ? (
          <span className={cx(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset truncate max-w-full text-center block",
            getAdSourceClass(lead.ad_source)
          )}>
            {lead.ad_source}
          </span>
        ) : (
          <span className="text-xs text-secondary block text-center">—</span>
        )}
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2 w-[130px] min-w-[130px]", getCellBgClass(isSelected, false))}>
        <select
          value={lead.status || "New"}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={cx(
            "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium shadow-xs outline-none transition-all focus:ring-4 focus:ring-brand/12 w-full",
            getStatusClass(lead.status),
          )}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        <div className="text-xs text-secondary truncate">{lead.location || "\u2014"}</div>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2 w-[160px] min-w-[160px]", getCellBgClass(isSelected, false))}>
        <select
          value={lead.sales_person || ""}
          onChange={(e) => onCrmFieldSave(lead, { sales_person: e.target.value }, "sales_person", "Owner updated.")}
          className="cursor-pointer rounded-lg border border-secondary bg-primary px-2.5 py-1 text-xs font-medium shadow-xs outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/12 w-full text-secondary"
        >
          <option value="">Unassigned</option>
          {owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2", getCellBgClass(isSelected, false))}>
        <div className="text-xs text-secondary truncate">
          {lead.follow_up ? formatShortDate(lead.follow_up) : "\u2014"}
        </div>
      </Table.Cell>
      <Table.Cell className={cx("align-middle py-2 px-2 text-right", getCellBgClass(isSelected, false))}>
        <Button
          size="xs"
          color="secondary"
          onPress={() => onOpenDetails(lead)}
        >
          View Details
        </Button>
      </Table.Cell>
    </Table.Row>
  );
}

function LeadDetailsDrawer({
  lead,
  saving,
  owners,
  onClose,
  onCrmFieldSave,
  onStatusChange,
  onFollowUpChange,
  onFollowUp2Change,
  onCopy,
  onDelete,
}: {
  lead: Lead;
  saving: string | null;
  owners: string[];
  onClose: () => void;
  onCrmFieldSave: (
    lead: Lead,
    updates: Partial<Lead>,
    savingKey: keyof Lead,
    successMessage: string,
  ) => void;
  onStatusChange: (id: string, status: string) => void;
  onFollowUpChange: (id: string, date: string) => void;
  onFollowUp2Change: (id: string, date: string) => void;
  onCopy: (lead: Lead) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState({
    notes: lead.notes || "",
    location: lead.location || "",
    sales_person: lead.sales_person || "",
    remark_1: lead.remark_1 || "",
    remark_2: lead.remark_2 || "",
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "",
    ad_source: lead.ad_source || "",
  });
  const initialDraft = useRef(draft);

  useEffect(() => {
    const nextDraft = {
      notes: lead.notes || "",
      location: lead.location || "",
      sales_person: lead.sales_person || "",
      remark_1: lead.remark_1 || "",
      remark_2: lead.remark_2 || "",
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "",
      ad_source: lead.ad_source || "",
    };
    setDraft(nextDraft);
    initialDraft.current = nextDraft;
  }, [lead]);

  function handleFieldBlur(field: keyof typeof draft, successMessage: string) {
    if (draft[field] === (lead[field] || "")) return;
    onCrmFieldSave(lead, { [field]: draft[field] }, field as keyof Lead, successMessage);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in bg-overlay backdrop-blur-xs">
      {/* Dismiss area */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Drawer content */}
      <div className="w-full max-w-lg bg-primary h-full shadow-2xl flex flex-col border-l border-secondary animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-secondary flex items-center justify-between bg-secondary/35">
          <div>
            <span className="text-xs text-tertiary uppercase font-bold tracking-wider">Lead Record</span>
            <h3 className="text-lg font-bold text-primary mt-1">{lead.name || "Unnamed Lead"}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopy(lead)}
              title="Copy lead details"
              className="p-2 rounded-lg hover:bg-secondary text-tertiary hover:text-primary transition-colors cursor-pointer"
            >
              <Copy01 className="size-4" />
            </button>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this lead?")) {
                  onDelete(lead.id);
                  onClose();
                }
              }}
              title="Delete lead"
              className="p-2 rounded-lg hover:bg-utility-red-50 text-tertiary hover:text-utility-red-600 transition-colors cursor-pointer"
            >
              <Trash01 className="size-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary text-tertiary hover:text-primary transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Main Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Created Date</label>
              <div className="text-sm text-tertiary bg-secondary/30 rounded-lg px-3 py-2 border border-secondary">
                {new Date(lead.created_at).toLocaleString()}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Lead Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  onBlur={() => handleFieldBlur("name", "Name updated.")}
                  className={CELL_INPUT_CLASS}
                />
                {saving === "name" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                  onBlur={() => handleFieldBlur("email", "Email updated.")}
                  className={CELL_INPUT_CLASS}
                />
                {saving === "email" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Phone</label>
              <div className="relative">
                <input
                  type="text"
                  value={draft.phone}
                  onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
                  onBlur={() => handleFieldBlur("phone", "Phone updated.")}
                  className={CELL_INPUT_CLASS}
                />
                {saving === "phone" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Source</label>
              <div className="relative">
                <input
                  type="text"
                  value={draft.source}
                  onChange={(e) => setDraft((prev) => ({ ...prev, source: e.target.value }))}
                  onBlur={() => handleFieldBlur("source", "Source updated.")}
                  className={CELL_INPUT_CLASS}
                />
                {saving === "source" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Ad Source</label>
              <div className="relative">
                <select
                  value={draft.ad_source || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({ ...prev, ad_source: val }));
                    onCrmFieldSave(lead, { ad_source: val }, "ad_source", "Ad Source updated.");
                  }}
                  className={CELL_INPUT_CLASS}
                >
                  <option value="">None / Organic / Direct</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Google Ads">Google Ads</option>
                </select>
                {saving === "ad_source" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Lead Status</label>
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
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Region</label>
              <div className="relative">
                <input
                  type="text"
                  value={draft.location}
                  onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  onBlur={() => handleFieldBlur("location", "Region updated.")}
                  placeholder="Add region"
                  className={CELL_INPUT_CLASS}
                />
                {saving === "location" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Owner</label>
              <div className="relative">
                <select
                  value={draft.sales_person}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({ ...prev, sales_person: val }));
                    onCrmFieldSave(lead, { sales_person: val }, "sales_person", "Owner updated.");
                  }}
                  className={CELL_INPUT_CLASS}
                >
                  <option value="">Unassigned</option>
          {owners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {saving === "sales_person" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Next Follow-Up</label>
              <div className="relative">
                <input
                  type="date"
                  value={lead.follow_up || ""}
                  onChange={(e) => onFollowUpChange(lead.id, e.target.value)}
                  className={CELL_INPUT_CLASS}
                />
                {saving === "follow_up" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Final Follow-Up</label>
              <div className="relative">
                <input
                  type="date"
                  value={lead.follow_up_2 || ""}
                  onChange={(e) => onFollowUp2Change(lead.id, e.target.value)}
                  className={CELL_INPUT_CLASS}
                />
                {saving === "follow_up_2" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Notes</label>
              <div className="relative">
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                  onBlur={() => handleFieldBlur("notes", "Notes updated.")}
                  rows={4}
                  placeholder="Add notes..."
                  className={CELL_TEXTAREA_CLASS}
                />
                {saving === "notes" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Note 1</label>
              <div className="relative">
                <input
                  type="text"
                  value={draft.remark_1}
                  onChange={(e) => setDraft((prev) => ({ ...prev, remark_1: e.target.value }))}
                  onBlur={() => handleFieldBlur("remark_1", "Note 1 updated.")}
                  placeholder="Add note"
                  className={CELL_INPUT_CLASS}
                />
                {saving === "remark_1" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Note 2</label>
              <div className="relative">
                <input
                  type="text"
                  value={draft.remark_2}
                  onChange={(e) => setDraft((prev) => ({ ...prev, remark_2: e.target.value }))}
                  onBlur={() => handleFieldBlur("remark_2", "Note 2 updated.")}
                  placeholder="Add note"
                  className={CELL_INPUT_CLASS}
                />
                {saving === "remark_2" && <span className="absolute right-2 top-2 text-[10px] text-brand">saving...</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

