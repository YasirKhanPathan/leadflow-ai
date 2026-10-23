import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
  .refine((value) => {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Pick a date")
  .transform((value) => new Date(value));

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => (value.trim() === "" ? null : value.trim()));

export const createFollowUpSchema = z.object({
  leadId: z.string().min(1),
  title: optionalText(200),
  message: optionalText(5000),
  dueDate: dateOnlySchema,
});

export const rescheduleSchema = z.object({
  id: z.string().min(1),
  dueDate: dateOnlySchema,
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
