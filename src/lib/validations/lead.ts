import { z } from "zod";
import { LeadSource, LeadStatus, Priority } from "@prisma/client";

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));
}

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(320)
    .pipe(z.email("Enter a valid email address")),
  company: optionalText(200),
  serviceNeeded: optionalText(200),
  budget: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z
      .coerce.number("Budget must be a number")
      .min(0, "Budget cannot be negative")
      .max(999999999999, "Budget is too large")
      .nullable(),
  ),
  source: z.nativeEnum(LeadSource).default(LeadSource.OTHER),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  notes: optionalText(5000),
  inquiry: optionalText(20000),
});

export const leadFilterSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .catch(undefined),
  status: z.nativeEnum(LeadStatus).optional().catch(undefined),
  source: z.nativeEnum(LeadSource).optional().catch(undefined),
  priority: z.nativeEnum(Priority).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadFilters = z.infer<typeof leadFilterSchema>;
