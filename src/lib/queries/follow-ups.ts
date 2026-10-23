import "server-only";

import type { FollowUpStatus } from "@prisma/client";
import { bucketOf, getUtcDayBounds, type FollowUpBucket } from "@/lib/dates";
import { formatDate, formatDateWithTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type FollowUpCounts = {
  overdue: number;
  today: number;
  upcoming: number;
};

export type FollowUpRow = {
  id: string;
  title: string | null;
  message: string | null;
  dueDate: string;
  dueDateLabel: string;
  status: FollowUpStatus;
  completedAt: string | null;
  completedAtLabel: string | null;
  bucket: FollowUpBucket | null;
  leadId: string;
  leadName: string;
  leadCompany: string | null;
};

const leadSelect = { id: true, name: true, company: true } as const;

function toRow(
  followUp: {
    id: string;
    title: string | null;
    message: string | null;
    dueDate: Date;
    status: FollowUpStatus;
    completedAt: Date | null;
    leadId: string;
    lead: { id: string; name: string; company: string | null };
  },
  bucket: FollowUpBucket | null,
): FollowUpRow {
  return {
    id: followUp.id,
    title: followUp.title,
    message: followUp.message,
    dueDate: followUp.dueDate.toISOString(),
    dueDateLabel: formatDate(followUp.dueDate.toISOString()),
    status: followUp.status,
    completedAt: followUp.completedAt
      ? followUp.completedAt.toISOString()
      : null,
    completedAtLabel: followUp.completedAt
      ? formatDateWithTime(followUp.completedAt.toISOString())
      : null,
    bucket,
    leadId: followUp.leadId,
    leadName: followUp.lead.name,
    leadCompany: followUp.lead.company,
  };
}

export async function getFollowUpCounts(options: {
  organizationId: string;
}): Promise<FollowUpCounts> {
  const { organizationId } = options;
  const bounds = getUtcDayBounds(new Date());

  const [overdue, today, upcoming] = await Promise.all([
    prisma.followUp.count({
      where: {
        organizationId,
        status: "OPEN",
        dueDate: { lt: bounds.startToday },
      },
    }),
    prisma.followUp.count({
      where: {
        organizationId,
        status: "OPEN",
        dueDate: { gte: bounds.startToday, lte: bounds.endToday },
      },
    }),
    prisma.followUp.count({
      where: {
        organizationId,
        status: "OPEN",
        dueDate: { gt: bounds.endToday },
      },
    }),
  ]);

  return { overdue, today, upcoming };
}

export async function getFollowUpsForOrg(options: {
  organizationId: string;
}): Promise<{ open: FollowUpRow[]; completed: FollowUpRow[] }> {
  const { organizationId } = options;
  const bounds = getUtcDayBounds(new Date());

  const [openItems, completedItems] = await Promise.all([
    prisma.followUp.findMany({
      where: { organizationId, status: "OPEN" },
      include: { lead: { select: leadSelect } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.followUp.findMany({
      where: { organizationId, status: "COMPLETED" },
      include: { lead: { select: leadSelect } },
      orderBy: { completedAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    open: openItems.map((item) => toRow(item, bucketOf(item.dueDate, bounds))),
    completed: completedItems.map((item) => toRow(item, null)),
  };
}

export async function getFollowUpsForLead(options: {
  organizationId: string;
  leadId: string;
}): Promise<{ open: FollowUpRow[]; completed: FollowUpRow[] } | null> {
  const { organizationId, leadId } = options;
  const bounds = getUtcDayBounds(new Date());

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId },
    select: { id: true },
  });
  if (!lead) {
    return null;
  }

  const [openItems, completedItems] = await Promise.all([
    prisma.followUp.findMany({
      where: { organizationId, leadId, status: "OPEN" },
      include: { lead: { select: leadSelect } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.followUp.findMany({
      where: { organizationId, leadId, status: "COMPLETED" },
      include: { lead: { select: leadSelect } },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    open: openItems.map((item) => toRow(item, bucketOf(item.dueDate, bounds))),
    completed: completedItems.map((item) => toRow(item, null)),
  };
}
