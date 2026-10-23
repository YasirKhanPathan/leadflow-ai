import "server-only";

import type { LeadSource, LeadStatus } from "@prisma/client";
import { formatMonthDay } from "@/lib/format";
import { leadSourceLabel, leadStatusStyle, LEAD_STATUSES } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getFollowUpCounts } from "@/lib/queries/follow-ups";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardKpis = {
  totalLeads: number;
  newInRange: number;
  wonInRange: number;
  conversionRate: number | null;
  overdueFollowUps: number;
  dueTodayFollowUps: number;
};

export type LeadsOverTimePoint = {
  date: string;
  count: number;
};

export type PipelineSlice = {
  status: LeadStatus;
  label: string;
  count: number;
};

export type SourceSlice = {
  source: LeadSource;
  label: string;
  count: number;
};

export type DashboardData = {
  kpis: DashboardKpis;
  leadsOverTime: LeadsOverTimePoint[];
  pipeline: PipelineSlice[];
  sources: SourceSlice[];
};

export async function getDashboardData(options: {
  organizationId: string;
  from: Date;
  to: Date;
}): Promise<DashboardData> {
  const { organizationId, from, to } = options;

  const [
    totalLeads,
    newInRange,
    wonInRange,
    wonAll,
    lostAll,
    leadsInRange,
    statusGroups,
    sourceGroups,
    followUpCounts,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId } }),
    prisma.lead.count({
      where: { organizationId, createdAt: { gte: from, lte: to } },
    }),
    prisma.lead.count({
      where: { organizationId, status: "WON", wonAt: { gte: from, lte: to } },
    }),
    prisma.lead.count({ where: { organizationId, status: "WON" } }),
    prisma.lead.count({ where: { organizationId, status: "LOST" } }),
    prisma.lead.findMany({
      where: { organizationId, createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { status: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { organizationId },
      _count: { source: true },
    }),
    getFollowUpCounts({ organizationId }),
  ]);

  const decided = wonAll + lostAll;
  const conversionRate = decided === 0 ? null : wonAll / decided;

  const dayCounts = new Map<number, number>();
  const startDay = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const endDay = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  );
  for (
    let d = startDay.getTime();
    d <= endDay.getTime();
    d += DAY_MS
  ) {
    dayCounts.set(d, 0);
  }
  for (const lead of leadsInRange) {
    const dayKey =
      Date.UTC(
        lead.createdAt.getUTCFullYear(),
        lead.createdAt.getUTCMonth(),
        lead.createdAt.getUTCDate(),
      );
    dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1);
  }
  const leadsOverTime: LeadsOverTimePoint[] = [];
  for (const [dayKey, count] of dayCounts) {
    leadsOverTime.push({ date: formatMonthDay(new Date(dayKey).toISOString()), count });
  }

  const statusCountMap = new Map<LeadStatus, number>();
  for (const g of statusGroups) {
    statusCountMap.set(g.status, g._count.status);
  }
  const pipeline: PipelineSlice[] = LEAD_STATUSES.map((status) => ({
    status,
    label: leadStatusStyle[status].label,
    count: statusCountMap.get(status) ?? 0,
  }));

  const sourceCountMap = new Map<LeadSource, number>();
  for (const g of sourceGroups) {
    if (g._count.source > 0) {
      sourceCountMap.set(g.source, g._count.source);
    }
  }
  const sources: SourceSlice[] = Array.from(sourceCountMap.entries()).map(
    ([source, count]) => ({
      source,
      label: leadSourceLabel[source],
      count,
    }),
  );

  return {
    kpis: {
      totalLeads,
      newInRange,
      wonInRange,
      conversionRate,
      overdueFollowUps: followUpCounts.overdue,
      dueTodayFollowUps: followUpCounts.today,
    },
    leadsOverTime,
    pipeline,
    sources,
  };
}
