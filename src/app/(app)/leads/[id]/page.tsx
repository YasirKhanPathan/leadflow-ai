import Link from "next/link";
import { notFound } from "next/navigation";
import { AiPanel } from "@/components/leads/ai-panel";
import { LeadFollowUps } from "@/components/leads/lead-follow-ups";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import type { LeadRow } from "@/components/leads/types";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { leadSourceLabel, leadStatusStyle, priorityStyle } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getFollowUpsForLead } from "@/lib/queries/follow-ups";

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const user = await requireAuth();
  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!lead) {
    notFound();
  }

  const followUps = await getFollowUpsForLead({
    organizationId: user.organizationId,
    leadId: lead.id,
  });

  const row: LeadRow = {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    serviceNeeded: lead.serviceNeeded,
    budget: lead.budget ? lead.budget.toString() : null,
    budgetLabel: lead.budget ? formatCurrency(lead.budget.toString()) : null,
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    notes: lead.notes,
    inquiry: lead.inquiry,
    createdAtLabel: formatDate(lead.createdAt.toISOString()),
  };

  const status = leadStatusStyle[lead.status];
  const priority = priorityStyle[lead.priority];

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/leads"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
            <Badge variant={priority.variant} className={priority.className}>
              {priority.label}
            </Badge>
          </div>
        </div>
        <LeadFormDialog lead={row} />
      </div>

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Email">{lead.email}</Field>
        <Field label="Company">{lead.company ?? <Dash />}</Field>
        <Field label="Service needed">{lead.serviceNeeded ?? <Dash />}</Field>
        <Field label="Budget (USD)">
          {lead.budget ? formatCurrency(lead.budget.toString()) : <Dash />}
        </Field>
        <Field label="Source">{leadSourceLabel[lead.source]}</Field>
        <Field label="Created">{formatDate(lead.createdAt.toISOString())}</Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Notes">
            {lead.notes ? (
              <p className="whitespace-pre-wrap">{lead.notes}</p>
            ) : (
              <Dash />
            )}
          </Field>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-background p-4">
        <h2 className="text-sm font-semibold">Inquiry</h2>
        {lead.inquiry ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {lead.inquiry}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No inquiry yet — use Edit to add one
          </p>
        )}
      </div>

      <AiPanel
        leadId={lead.id}
        initialAnalysis={
          lead.aiAnalyzedAt && lead.aiSummary
            ? {
                summary: lead.aiSummary,
                service: lead.aiService,
                budget: lead.aiBudget,
                timeline: lead.aiTimeline,
                priority: lead.aiPriority,
                priorityReason: lead.aiPriorityReason,
                analyzedAt: lead.aiAnalyzedAt.toISOString(),
              }
            : null
        }
        initialDraft={lead.aiDraftReply}
        initialApprovedAt={
          lead.aiReplyApprovedAt ? lead.aiReplyApprovedAt.toISOString() : null
        }
      />

      <LeadFollowUps
        leadId={lead.id}
        open={followUps?.open ?? []}
        completed={followUps?.completed ?? []}
      />
    </div>
  );
}
