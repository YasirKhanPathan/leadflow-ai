"use server";

import { Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AiError, analyzeInquiry, draftReply as draftReplyAi } from "@/lib/ai";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveAiDraftSchema } from "@/lib/validations/ai";

const idSchema = z.string().min(1);

export type AiActionState = {
  error?: string;
};

export type AnalysisResult = {
  summary: string;
  service: string | null;
  budget: string | null;
  timeline: string | null;
  priority: Priority | null;
  priorityReason: string | null;
  analyzedAt: string;
};

export async function analyzeLead(
  id: string,
): Promise<AiActionState & { analysis?: AnalysisResult }> {
  const user = await requireAuth();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Lead not found" };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: parsedId.data, organizationId: user.organizationId },
    select: { inquiry: true },
  });
  if (!lead) {
    return { error: "Lead not found" };
  }
  if (!lead.inquiry?.trim()) {
    return { error: "Add an inquiry to this lead first" };
  }

  let analysis;
  try {
    analysis = await analyzeInquiry({ inquiry: lead.inquiry });
  } catch (error) {
    if (error instanceof AiError) {
      return { error: error.message };
    }
    return { error: "AI request failed — try again" };
  }

  const analyzedAt = new Date();
  const result = await prisma.lead.updateMany({
    where: { id: parsedId.data, organizationId: user.organizationId },
    data: {
      aiSummary: analysis.summary,
      aiService: analysis.service,
      aiBudget: analysis.budget,
      aiTimeline: analysis.timeline,
      aiPriority: analysis.priority,
      aiPriorityReason: analysis.priorityReason,
      aiAnalyzedAt: analyzedAt,
    },
  });
  if (result.count === 0) {
    return { error: "Lead not found" };
  }

  return {
    analysis: {
      summary: analysis.summary,
      service: analysis.service,
      budget: analysis.budget,
      timeline: analysis.timeline,
      priority: analysis.priority,
      priorityReason: analysis.priorityReason,
      analyzedAt: analyzedAt.toISOString(),
    },
  };
}

export async function draftReply(
  id: string,
): Promise<AiActionState & { reply?: string }> {
  const user = await requireAuth();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Lead not found" };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: parsedId.data, organizationId: user.organizationId },
    select: { name: true, company: true, inquiry: true },
  });
  if (!lead) {
    return { error: "Lead not found" };
  }
  if (!lead.inquiry?.trim()) {
    return { error: "Add an inquiry to this lead first" };
  }

  let draft;
  try {
    draft = await draftReplyAi({
      name: lead.name,
      company: lead.company,
      inquiry: lead.inquiry,
    });
  } catch (error) {
    if (error instanceof AiError) {
      return { error: error.message };
    }
    return { error: "AI request failed — try again" };
  }

  const result = await prisma.lead.updateMany({
    where: { id: parsedId.data, organizationId: user.organizationId },
    data: { aiDraftReply: draft.reply, aiReplyApprovedAt: null },
  });
  if (result.count === 0) {
    return { error: "Lead not found" };
  }

  return { reply: draft.reply };
}

export async function saveAiDraft(
  id: string,
  text: string,
): Promise<AiActionState> {
  const user = await requireAuth();

  const parsed = saveAiDraftSchema.safeParse({ id, text });
  if (!parsed.success) {
    return { error: "Draft text is required" };
  }

  const result = await prisma.lead.updateMany({
    where: { id: parsed.data.id, organizationId: user.organizationId },
    data: { aiDraftReply: parsed.data.text, aiReplyApprovedAt: null },
  });
  if (result.count === 0) {
    return { error: "Lead not found" };
  }

  revalidatePath(`/leads/${parsed.data.id}`);
  return {};
}

export async function approveAiReply(id: string): Promise<AiActionState> {
  const user = await requireAuth();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Lead not found" };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: parsedId.data, organizationId: user.organizationId },
    select: { aiDraftReply: true },
  });
  if (!lead) {
    return { error: "Lead not found" };
  }
  if (!lead.aiDraftReply?.trim()) {
    return { error: "No draft reply to approve" };
  }

  const result = await prisma.lead.updateMany({
    where: { id: parsedId.data, organizationId: user.organizationId },
    data: { aiReplyApprovedAt: new Date() },
  });
  if (result.count === 0) {
    return { error: "Lead not found" };
  }

  revalidatePath(`/leads/${parsedId.data}`);
  return {};
}

const setPrioritySchema = z.object({
  id: z.string().min(1),
  priority: z.nativeEnum(Priority),
});

export async function setLeadPriority(
  id: string,
  priority: Priority,
): Promise<AiActionState> {
  const user = await requireAuth();

  const parsed = setPrioritySchema.safeParse({ id, priority });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const result = await prisma.lead.updateMany({
    where: { id: parsed.data.id, organizationId: user.organizationId },
    data: { priority: parsed.data.priority },
  });
  if (result.count === 0) {
    return { error: "Lead not found" };
  }

  revalidatePath(`/leads/${parsed.data.id}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return {};
}
