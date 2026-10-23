"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AiError, suggestFollowUpMessage as suggestFollowUpMessageAi } from "@/lib/ai";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFollowUpSchema, rescheduleSchema } from "@/lib/validations/follow-up";

export type FollowUpFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

export type FollowUpActionState = {
  error?: string;
};

const idSchema = z.string().min(1);

function revalidateFollowUpViews() {
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}

export async function createFollowUp(
  _prevState: FollowUpFormState,
  formData: FormData,
): Promise<FollowUpFormState> {
  const user = await requireAuth();

  const parsed = createFollowUpSchema.safeParse({
    leadId: formData.get("leadId") ?? "",
    title: formData.get("title") ?? "",
    message: formData.get("message") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: parsed.data.leadId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!lead) {
    return { error: "Lead not found" };
  }

  await prisma.followUp.create({
    data: {
      organizationId: user.organizationId,
      leadId: lead.id,
      createdById: user.id,
      title: parsed.data.title,
      message: parsed.data.message,
      dueDate: parsed.data.dueDate,
    },
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

async function mutateFollowUp(
  id: string,
  data: { status?: "COMPLETED" | "OPEN" | "CANCELLED"; completedAt?: Date | null; dueDate?: Date },
): Promise<FollowUpActionState> {
  const user = await requireAuth();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "Follow-up not found" };
  }

  const result = await prisma.followUp.updateMany({
    where: { id: parsedId.data, organizationId: user.organizationId },
    data,
  });
  if (result.count === 0) {
    return { error: "Follow-up not found" };
  }

  revalidateFollowUpViews();
  return {};
}

export async function completeFollowUp(id: string): Promise<FollowUpActionState> {
  return mutateFollowUp(id, { status: "COMPLETED", completedAt: new Date() });
}

export async function reopenFollowUp(id: string): Promise<FollowUpActionState> {
  return mutateFollowUp(id, { status: "OPEN", completedAt: null });
}

export async function cancelFollowUp(id: string): Promise<FollowUpActionState> {
  return mutateFollowUp(id, { status: "CANCELLED" });
}

export async function rescheduleFollowUp(
  id: string,
  dueDate: string,
): Promise<FollowUpActionState> {
  const user = await requireAuth();

  const parsed = rescheduleSchema.safeParse({ id, dueDate });
  if (!parsed.success) {
    return { error: "Invalid date" };
  }

  const result = await prisma.followUp.updateMany({
    where: { id: parsed.data.id, organizationId: user.organizationId },
    data: { dueDate: parsed.data.dueDate },
  });
  if (result.count === 0) {
    return { error: "Follow-up not found" };
  }

  revalidateFollowUpViews();
  return {};
}

export async function suggestFollowUpMessage(
  leadId: string,
): Promise<FollowUpActionState & { message?: string }> {
  const user = await requireAuth();

  const parsedId = idSchema.safeParse(leadId);
  if (!parsedId.success) {
    return { error: "Lead not found" };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: parsedId.data, organizationId: user.organizationId },
    select: {
      name: true,
      company: true,
      serviceNeeded: true,
      inquiry: true,
      aiSummary: true,
      aiService: true,
      aiBudget: true,
      aiTimeline: true,
      aiPriority: true,
    },
  });
  if (!lead) {
    return { error: "Lead not found" };
  }

  let suggestion;
  try {
    suggestion = await suggestFollowUpMessageAi({
      name: lead.name,
      company: lead.company,
      serviceNeeded: lead.serviceNeeded,
      inquiry: lead.inquiry,
      analysis:
        lead.aiSummary || lead.aiService || lead.aiBudget || lead.aiTimeline || lead.aiPriority
          ? {
              summary: lead.aiSummary,
              service: lead.aiService,
              budget: lead.aiBudget,
              timeline: lead.aiTimeline,
              priority: lead.aiPriority,
            }
          : null,
    });
  } catch (error) {
    if (error instanceof AiError) {
      return { error: error.message };
    }
    return { error: "AI request failed — try again" };
  }

  return { message: suggestion.message };
}
