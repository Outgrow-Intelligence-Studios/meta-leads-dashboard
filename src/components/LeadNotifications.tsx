import { useEffect, useState, useRef } from "react";
import { Bell01, Calendar, ClockRewind, Users01, X } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import type { Lead } from "@/lib/api";
import { getLeadInsights } from "@/lib/lead-insights";
import { cx } from "@/utils/cx";

type Props = {
  leads: Lead[];
};

type ToastNotification = {
  id: string;
  title: string;
  detail: string;
  tone: "brand" | "warning" | "neutral";
  icon: typeof Users01;
  timestamp: number;
};

function NotificationRow({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "neutral" | "brand" | "warning";
  icon: typeof Users01;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-primary_hover">
      <div
        className={cx(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          tone === "brand" && "bg-utility-brand-50 text-utility-brand-600 ring-utility-brand-100",
          tone === "warning" && "bg-utility-yellow-50 text-utility-yellow-700 ring-utility-yellow-100",
          tone === "neutral" && "bg-secondary text-tertiary ring-secondary",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-primary">{value}</div>
        <div className="text-xs text-tertiary">{label}</div>
      </div>
    </div>
  );
}

function ToastPopup({
  notification,
  onDismiss,
}: {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}) {
  const { id, title, detail, tone, icon: Icon } = notification;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 6000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div
      role="alert"
      className={cx(
        "pointer-events-auto flex w-[360px] items-start gap-3 rounded-2xl bg-primary p-4 shadow-2xl ring-1 ring-secondary animate-in slide-in-from-right-5 fade-in duration-300",
      )}
    >
      <div
        className={cx(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          tone === "brand" && "bg-utility-brand-50 text-utility-brand-600 ring-utility-brand-100",
          tone === "warning" && "bg-utility-yellow-50 text-utility-yellow-700 ring-utility-yellow-100",
          tone === "neutral" && "bg-secondary text-tertiary ring-secondary",
        )}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-primary">{title}</div>
        <div className="mt-0.5 text-xs text-tertiary">{detail}</div>
      </div>

      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded-md p-1 text-tertiary transition hover:bg-primary_hover hover:text-primary"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export default function LeadNotifications({ leads }: Props) {
  const insights = getLeadInsights(leads);
  const unreadCount = insights.newToday + insights.dueToday + insights.overdue;
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (leads.length === 0) return;

    const today = new Date();
    const newToasts: ToastNotification[] = [];

    const recent = leads
      .filter((l) => l.status === "New")
      .slice(0, 3);

    for (const lead of recent) {
      const key = `new-${lead.id}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);

      if (isFirstLoadRef.current) continue;

      newToasts.push({
        id: `${key}-${Date.now()}`,
        title: `New lead: ${lead.name}`,
        detail: `${lead.email} · ${lead.source || "Landing Page"}`,
        tone: "brand",
        icon: Users01,
        timestamp: Date.now(),
      });
    }

    const overdue = leads
      .filter((l) => {
        if (l.status === "Won" || l.status === "Lost") return false;
        if (!l.follow_up) return false;
        return new Date(l.follow_up) < today && new Date(l.follow_up).toDateString() !== today.toDateString();
      })
      .slice(0, 3);

    for (const lead of overdue) {
      const key = `overdue-${lead.id}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);

      if (isFirstLoadRef.current) continue;

      const dueDate = new Date(lead.follow_up!);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      newToasts.push({
        id: `${key}-${Date.now()}`,
        title: `Overdue: ${lead.name}`,
        detail: `Follow-up was ${daysOverdue === 0 ? "today" : `${daysOverdue}d ago`}`,
        tone: "warning",
        icon: ClockRewind,
        timestamp: Date.now(),
      });
    }

    const dueToday = leads
      .filter((l) => {
        if (l.status === "Won" || l.status === "Lost") return false;
        if (!l.follow_up) return false;
        const d = new Date(l.follow_up);
        return d.toDateString() === today.toDateString();
      })
      .slice(0, 3);

    for (const lead of dueToday) {
      const key = `due-${lead.id}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);

      if (isFirstLoadRef.current) continue;

      newToasts.push({
        id: `${key}-${Date.now()}`,
        title: `Follow-up today: ${lead.name}`,
        detail: lead.email,
        tone: "neutral",
        icon: Calendar,
        timestamp: Date.now(),
      });
    }

    if (!isFirstLoadRef.current && newToasts.length > 0) {
      setToasts((prev) => [...newToasts, ...prev].slice(0, 5));
    }

    isFirstLoadRef.current = false;
  }, [leads]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastPopup key={toast.id} notification={toast} onDismiss={dismissToast} />
        ))}
      </div>

      <Dropdown.Root>
        <button
          aria-label="Open notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-fg-quaternary shadow-xs ring-1 ring-secondary transition hover:bg-primary_hover hover:text-primary"
        >
          <Bell01 className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-solid px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <Dropdown.Popover className="w-[360px] rounded-2xl bg-primary p-0 shadow-xl ring-1 ring-secondary">
          <div className="border-b border-secondary px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-primary">Lead activity</div>
                <div className="mt-0.5 text-xs text-tertiary">Daily CRM pulse and follow-up workload.</div>
              </div>
              <div className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary ring-1 ring-secondary">
                {insights.totalLeads} total
              </div>
            </div>
          </div>

          <div className="space-y-1 p-3">
            <NotificationRow
              label="New leads created today"
              value={`${insights.newToday} new today`}
              tone="brand"
              icon={Users01}
            />
            <NotificationRow
              label="Follow-ups scheduled for today"
              value={`${insights.dueToday} due today`}
              tone="neutral"
              icon={Calendar}
            />
            <NotificationRow
              label="Open leads with overdue follow-ups"
              value={`${insights.overdue} overdue`}
              tone="warning"
              icon={ClockRewind}
            />
          </div>

          {insights.newToday + insights.dueToday + insights.overdue > 0 && (
            <div className="border-t border-secondary px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">
                Recent activity
              </div>
              <div className="space-y-1">
                {leads
                  .filter((l) => {
                    const today = new Date();
                    const created = new Date(l.created_at);
                    const isNew = created.toDateString() === today.toDateString();
                    const isOverdue =
                      l.follow_up &&
                      l.status !== "Won" &&
                      l.status !== "Lost" &&
                      new Date(l.follow_up) < today &&
                      new Date(l.follow_up).toDateString() !== today.toDateString();
                    return isNew || isOverdue;
                  })
                  .slice(0, 5)
                  .map((lead) => {
                    const today = new Date();
                    const isNew = new Date(lead.created_at).toDateString() === today.toDateString();
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-primary_hover"
                      >
                        <div
                          className={cx(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            isNew
                              ? "bg-utility-brand-50 text-utility-brand-600"
                              : "bg-utility-yellow-50 text-utility-yellow-700",
                          )}
                        >
                          {lead.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-primary">
                            {lead.name}
                          </div>
                          <div className="truncate text-xs text-tertiary">
                            {isNew ? "New lead" : "Overdue follow-up"} · {lead.email}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="border-t border-secondary px-4 py-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Status mix</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(insights.statusCounts).map(([status, count]) => (
                <div key={status} className="rounded-xl bg-secondary px-3 py-2 ring-1 ring-secondary">
                  <div className="text-sm font-semibold text-primary">{count}</div>
                  <div className="text-[11px] text-tertiary">{status}</div>
                </div>
              ))}
            </div>
          </div>
        </Dropdown.Popover>
      </Dropdown.Root>
    </>
  );
}
