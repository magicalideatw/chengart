"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import {
  buildPerformanceCourseIdSet,
} from "@/lib/admin/performance-order-management";
import { revalidateAdminActivityStatsPaths } from "@/lib/admin/revalidate-paths";
import {
  clearAllPerformanceOrders,
  clearAllRegistrations,
  countAllPerformanceOrders,
  countAllRegistrations,
  deletePerformanceOrdersByIds,
} from "@/lib/admin/bulk-delete";
import { deleteRegistration } from "@/lib/actions/admin/registrations";
import { getAllCourses } from "@/lib/courses/queries";
import { getAdminMutationClient } from "@/lib/admin/admin-mutation-client";
import {
  bulkDeleteConfirmationSchema,
  deletePerformanceOrdersSchema,
} from "@/lib/validation/bulk-delete-schema";

export type BulkDeleteCountResult =
  | { success: true; count: number }
  | { success: false; error: string };

export type BulkDeleteResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

async function getAuthedClient() {
  await requireAuthenticatedUser();
  return getAdminMutationClient();
}

function revalidateRegistrationPaths() {
  revalidatePath("/admin");
  revalidateAdminActivityStatsPaths();
}

function revalidatePerformanceOrderPaths() {
  revalidateAdminActivityStatsPaths();
}

export async function deleteRegistrationsBatchAction(
  registrationIds: string[],
): Promise<BulkDeleteResult> {
  const result = await deleteRegistration(registrationIds);
  if (!result.success) {
    return { success: false, error: result.error ?? "刪除失敗" };
  }

  return {
    success: true,
    deletedCount: registrationIds.length,
  };
}

export async function fetchRegistrationClearCountAction(): Promise<BulkDeleteCountResult> {
  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const count = await countAllRegistrations(supabase);
  return { success: true, count };
}

export async function clearAllRegistrationsAction(input: {
  confirmation: string;
}): Promise<BulkDeleteResult> {
  const parsed = bulkDeleteConfirmationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "確認字串有誤",
    };
  }

  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const result = await clearAllRegistrations(supabase);
  if (!result.success) return result;

  revalidateRegistrationPaths();
  return result;
}

export async function deletePerformanceOrdersBatchAction(
  orderIds: string[],
): Promise<BulkDeleteResult> {
  const parsed = deletePerformanceOrdersSchema.safeParse({ orderIds });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "參數有誤",
    };
  }

  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const result = await deletePerformanceOrdersByIds(supabase, parsed.data.orderIds);
  if (!result.success) return result;

  revalidatePerformanceOrderPaths();
  return result;
}

export async function fetchPerformanceOrderClearCountAction(): Promise<BulkDeleteCountResult> {
  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const courses = await getAllCourses();
  const performanceCourseIds = buildPerformanceCourseIdSet(courses);
  const count = await countAllPerformanceOrders(supabase, performanceCourseIds);
  return { success: true, count };
}

export async function clearAllPerformanceOrdersAction(input: {
  confirmation: string;
}): Promise<BulkDeleteResult> {
  const parsed = bulkDeleteConfirmationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "確認字串有誤",
    };
  }

  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const courses = await getAllCourses();
  const performanceCourseIds = buildPerformanceCourseIdSet(courses);
  const result = await clearAllPerformanceOrders(supabase, performanceCourseIds);
  if (!result.success) return result;

  revalidatePerformanceOrderPaths();
  return result;
}
