import type { LeadStatus, Priority } from "@prisma/client";

export type PipelineLead = {
  id: string;
  name: string;
  company: string | null;
  budget: string | null;
  status: LeadStatus;
  priority: Priority;
  createdAt: string;
};
