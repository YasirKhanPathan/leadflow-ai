import type { LeadSource, LeadStatus, Priority } from "@prisma/client";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

export type BadgeStyle = {
  label: string;
  variant: BadgeVariant;
  className?: string;
};

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
] as const satisfies readonly LeadStatus[];

export const LEAD_SOURCES = [
  "WEBSITE",
  "REFERRAL",
  "SOCIAL_MEDIA",
  "EMAIL",
  "COLD_OUTREACH",
  "OTHER",
] as const satisfies readonly LeadSource[];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const satisfies readonly Priority[];

export const leadStatusStyle: Record<LeadStatus, BadgeStyle> = {
  NEW: { label: "New", variant: "secondary" },
  CONTACTED: {
    label: "Contacted",
    variant: "outline",
    className: "border-blue-200! bg-blue-50! text-blue-700!",
  },
  QUALIFIED: {
    label: "Qualified",
    variant: "outline",
    className: "border-purple-200! bg-purple-50! text-purple-700!",
  },
  PROPOSAL_SENT: {
    label: "Proposal Sent",
    variant: "outline",
    className: "border-amber-200! bg-amber-50! text-amber-700!",
  },
  WON: {
    label: "Won",
    variant: "outline",
    className: "border-green-200! bg-green-50! text-green-700!",
  },
  LOST: { label: "Lost", variant: "destructive" },
};

export const priorityStyle: Record<Priority, BadgeStyle> = {
  LOW: { label: "Low", variant: "secondary" },
  MEDIUM: {
    label: "Medium",
    variant: "outline",
    className: "border-amber-200! bg-amber-50! text-amber-700!",
  },
  HIGH: { label: "High", variant: "destructive" },
};

export const leadSourceLabel: Record<LeadSource, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  EMAIL: "Email",
  COLD_OUTREACH: "Cold Outreach",
  OTHER: "Other",
};
