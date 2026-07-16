"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import {
  deleteTicketType,
  getTicketTypesByCourseId,
  saveTicketType,
} from "@/lib/ticket-types/queries";
import { ticketTypeSchema } from "@/lib/validation/ticket-type-schema";

export async function saveTicketTypeAction(input: {
  id?: string;
  courseId: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = ticketTypeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const result = await saveTicketType(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error ?? "儲存失敗" };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${input.courseId}`);
  return { success: true };
}

export async function deleteTicketTypeAction(
  ticketTypeId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const result = await deleteTicketType(ticketTypeId);
  if (!result.success) {
    return { success: false, error: result.error ?? "刪除失敗" };
  }

  revalidatePath("/admin/courses");
  return { success: true };
}

export async function getTicketTypesForCourseAction(courseId: string) {
  await requireAuthenticatedUser();
  return getTicketTypesByCourseId(courseId);
}
