import { Priority } from "@prisma/client";
import { z } from "zod";

export const analysisOutputSchema = z.object({
  summary: z.string().min(1).max(1500),
  service: z.string().max(200).nullable(),
  budget: z.string().max(200).nullable(),
  timeline: z.string().max(200).nullable(),
  priority: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .pipe(z.nativeEnum(Priority))
    .nullable(),
  priorityReason: z.string().max(300).nullable(),
});

export const draftOutputSchema = z.object({
  reply: z.string().min(1).max(8000),
});

export const suggestionOutputSchema = z.object({
  message: z.string().min(1).max(4000),
});

export const saveAiDraftSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(8000),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
export type DraftOutput = z.infer<typeof draftOutputSchema>;
export type SuggestionOutput = z.infer<typeof suggestionOutputSchema>;
