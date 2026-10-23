"use server";

import { Prisma } from "@prisma/client";
import { LeadStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { statusTimestamps } from "@/lib/lead-status";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/validations/lead";

export type LeadFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

function leadInputFrom(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    company: formData.get("company"),
    serviceNeeded: formData.get("serviceNeeded"),
    budget: formData.get("budget"),
    source: formData.get("source") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    notes: formData.get("notes"),
    inquiry: formData.get("inquiry"),
  };
}

function toLeadError(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return "Lead not found";
  }
  return "Something went wrong. Please try again.";
}

export async function createLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const user = await requireAuth();

  const parsed = leadSchema.safeParse(leadInputFrom(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.lead.create({
      data: { ...parsed.data, organizationId: user.organizationId },
    });
  } catch (error) {
    return { error: toLeadError(error) };
  }

  revalidatePath("/leads");
  return { success: true };
}

export async function updateLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const user = await requireAuth();

  const id = z
    .string()
    .min(1, "Lead not found")
    .safeParse(formData.get("id"));
  if (!id.success) {
    return { error: "Lead not found" };
  }

  const parsed = leadSchema.safeParse(leadInputFrom(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let count = 0;
  try {
    const result = await prisma.lead.updateMany({
      where: { id: id.data, organizationId: user.organizationId },
      data: { ...parsed.data, ...statusTimestamps(parsed.data.status) },
    });
    count = result.count;
  } catch (error) {
    return { error: toLeadError(error) };
  }

  if (count === 0) {
    return { error: "Lead not found" };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id.data}`);
  return { success: true };
}

export async function deleteLead(id: string): Promise<LeadFormState> {
  const user = await requireAuth();

  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) {
    return { error: "Lead not found" };
  }

  try {
    const result = await prisma.lead.deleteMany({
      where: { id: parsedId.data, organizationId: user.organizationId },
    });
    if (result.count === 0) {
      return { error: "Lead not found" };
    }
  } catch (error) {
    return { error: toLeadError(error) };
  }

  revalidatePath("/leads");
  return { success: true };
}

const updateLeadStatusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(LeadStatus),
});

export async function updateLeadStatus(input: {
  id: string;
  status: LeadStatus;
}): Promise<{ error?: string }> {
  const user = await requireAuth();

  const parsed = updateLeadStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  let count = 0;
  try {
    const result = await prisma.lead.updateMany({
      where: { id: parsed.data.id, organizationId: user.organizationId },
      data: {
        status: parsed.data.status,
        ...statusTimestamps(parsed.data.status),
      },
    });
    count = result.count;
  } catch (error) {
    return { error: toLeadError(error) };
  }

  if (count === 0) {
    return { error: "Lead not found" };
  }

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  return {};
}
