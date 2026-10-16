import type { LeadSource, LeadStatus, Priority } from "@prisma/client";

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  serviceNeeded: string | null;
  budget: string | null;
  budgetLabel: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: Priority;
  notes: string | null;
  inquiry: string | null;
  createdAtLabel: string;
};
