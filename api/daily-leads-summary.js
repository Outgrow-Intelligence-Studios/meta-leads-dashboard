import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const REQUIRED_ENVS = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_TO_EMAIL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isClosedStatus(status) {
  return status === "Won" || status === "Lost";
}

function getLeadInsights(leads, now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const statusCounts = {
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
    statusCounts[lead.status] = (statusCounts[lead.status] ?? 0) + 1;

    const createdAt = new Date(lead.created_at);
    if (!Number.isNaN(createdAt.getTime()) && startOfDay(createdAt).getTime() === today.getTime()) {
      newToday += 1;
    }

    if (isClosedStatus(lead.status)) continue;

    const followUps = [lead.follow_up, lead.follow_up_2].filter(Boolean);
    let hasTodayFollowUp = false;
    let hasOverdueFollowUp = false;

    for (const followUp of followUps) {
      const dueAt = new Date(followUp);
      if (Number.isNaN(dueAt.getTime())) continue;
      const dueDay = startOfDay(dueAt);

      if (dueDay.getTime() < today.getTime()) hasOverdueFollowUp = true;
      if (dueDay.getTime() >= today.getTime() && dueDay.getTime() < tomorrow.getTime()) hasTodayFollowUp = true;
    }

    if (hasTodayFollowUp) dueToday += 1;
    if (hasOverdueFollowUp) overdue += 1;
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

function missingEnvResponse(res) {
  const missing = REQUIRED_ENVS.filter((key) => !process.env[key]);
  return res.status(500).json({
    error: "Missing required environment variables.",
    missing,
  });
}

function formatStatusRows(statusCounts) {
  return Object.entries(statusCounts)
    .map(
      ([status, count]) => `
        <tr>
          <td style="padding:8px 0;color:#475467;font-size:14px;">${status}</td>
          <td style="padding:8px 0;color:#101828;font-size:14px;font-weight:600;text-align:right;">${count}</td>
        </tr>
      `,
    )
    .join("");
}

function buildEmailHtml(insights) {
  return `
    <div style="margin:0;background:#f8fafc;padding:32px;font-family:Inter,system-ui,sans-serif;color:#101828;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #eaecf0;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 28px 20px;border-bottom:1px solid #eaecf0;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#667085;font-weight:700;">Outgrow CRM</div>
          <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;">Daily leads summary</h1>
          <p style="margin:8px 0 0;color:#475467;font-size:14px;">Lead volume, current status mix, and the follow-up queue for today.</p>
        </div>

        <div style="padding:24px 28px;">
          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;">
            ${[
              ["Total leads", insights.totalLeads],
              ["New today", insights.newToday],
              ["Due today", insights.dueToday],
              ["Overdue", insights.overdue],
            ]
              .map(
                ([label, value]) => `
                  <div style="border:1px solid #eaecf0;border-radius:16px;padding:16px;background:#fcfcfd;">
                    <div style="font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:.08em;">${label}</div>
                    <div style="margin-top:8px;font-size:28px;font-weight:700;color:#101828;">${value}</div>
                  </div>
                `,
              )
              .join("")}
          </div>

          <div style="margin-top:24px;border:1px solid #eaecf0;border-radius:16px;padding:18px 20px;">
            <div style="font-size:13px;font-weight:700;color:#344054;text-transform:uppercase;letter-spacing:.08em;">Lead status mix</div>
            <table style="width:100%;border-collapse:collapse;margin-top:12px;">
              <tbody>
                ${formatStatusRows(insights.statusCounts)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (REQUIRED_ENVS.some((key) => !process.env[key])) {
    return missingEnvResponse(res);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await supabase
    .from("leads")
    .select("status, created_at, follow_up, follow_up_2")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const insights = getLeadInsights(data ?? []);
  const subject = `Daily leads summary: ${insights.newToday} new, ${insights.dueToday} due today`;

  const { data: emailData, error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: [process.env.RESEND_TO_EMAIL],
    subject,
    html: buildEmailHtml(insights),
  });

  if (emailError) {
    return res.status(500).json({ error: emailError.message });
  }

  return res.status(200).json({
    ok: true,
    emailId: emailData?.id ?? null,
    insights,
  });
}
