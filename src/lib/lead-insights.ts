export type LeadStatus = "New" | "Contacted" | "Hot" | "Won" | "Lost";

export type LeadInsightInput = {
  status: LeadStatus;
  created_at: string;
  follow_up: string | null;
  follow_up_2: string | null;
};

export type LeadInsights = {
  totalLeads: number;
  newToday: number;
  dueToday: number;
  overdue: number;
  actionItems: number;
  statusCounts: Record<LeadStatus, number>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function isClosedStatus(status: LeadStatus) {
  return status === "Won" || status === "Lost";
}

export function getLeadInsights(leads: LeadInsightInput[], now = new Date()): LeadInsights {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);

  const statusCounts: Record<LeadStatus, number> = {
    New: 0,
    Contacted: 0,
    Hot: 0,
    Won: 0,
    Lost: 0,
  };

  let newToday = 0;
  let dueToday = 0;
  let overdue = 0;

  for (const lead of leads) {
    statusCounts[lead.status] += 1;

    const createdAt = new Date(lead.created_at);
    if (!Number.isNaN(createdAt.getTime()) && sameDay(createdAt, today)) {
      newToday += 1;
    }

    if (isClosedStatus(lead.status)) continue;

    const followUps = [lead.follow_up, lead.follow_up_2].filter(Boolean) as string[];
    const uniqueDueDays = new Set<string>();

    for (const followUp of followUps) {
      const dueAt = new Date(followUp);
      if (Number.isNaN(dueAt.getTime())) continue;
      const dueDay = startOfDay(dueAt);
      const dueKey = dueDay.toISOString();

      if (dueDay.getTime() < today.getTime()) {
        uniqueDueDays.add(`overdue:${dueKey}`);
      } else if (dueDay.getTime() >= today.getTime() && dueDay.getTime() < tomorrow.getTime()) {
        uniqueDueDays.add(`today:${dueKey}`);
      }
    }

    if (Array.from(uniqueDueDays).some((key) => key.startsWith("today:"))) {
      dueToday += 1;
    }
    if (Array.from(uniqueDueDays).some((key) => key.startsWith("overdue:"))) {
      overdue += 1;
    }
  }

  return {
    totalLeads: leads.length,
    newToday,
    dueToday,
    overdue,
    actionItems: newToday + dueToday + overdue,
    statusCounts,
  };
}
