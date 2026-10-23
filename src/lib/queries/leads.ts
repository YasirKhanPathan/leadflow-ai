import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LeadFilters } from "@/lib/validations/lead";

export const PAGE_SIZE = 10;

type LeadQueryParams = {
  organizationId: string;
  filters: LeadFilters;
};

function buildWhere({ organizationId, filters }: LeadQueryParams): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = { organizationId };

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.priority) where.priority = filters.priority;

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
      { notes: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getLeads({ organizationId, filters }: LeadQueryParams) {
  const page = filters.page;
  return prisma.lead.findMany({
    where: buildWhere({ organizationId, filters }),
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
}

export async function countLeads({ organizationId, filters }: LeadQueryParams) {
  return prisma.lead.count({ where: buildWhere({ organizationId, filters }) });
}

export async function getPipelineLeads(organizationId: string) {
  return prisma.lead.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      company: true,
      budget: true,
      status: true,
      priority: true,
      createdAt: true,
    },
  });
}
