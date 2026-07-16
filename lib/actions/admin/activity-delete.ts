"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import {
  archiveActivity,
  deleteActivityCascade,
  getActivityDeleteSummary,
  type ActivityDeleteSummary,
} from "@/lib/admin/activity-delete";
import { revalidateAdminActivityStatsPaths } from "@/lib/admin/revalidate-paths";
import { getAdminMutationClient } from "@/lib/admin/admin-mutation-client";
import {
  archiveActivitiesBatchSchema,
  archiveActivitySchema,
  deleteActivitiesBatchSchema,
  deleteActivityCascadeSchema,
} from "@/lib/validation/activity-delete-schema";

export type ActivityDeleteSummaryResult =
  | { success: true; summary: ActivityDeleteSummary }
  | { success: false; error: string };

function revalidateActivityPaths(courseId: string) {
  revalidatePath("/");
  revalidateAdminActivityStatsPaths(courseId);
}

async function getAuthedClient() {
  await requireAuthenticatedUser();
  return getAdminMutationClient();
}

export async function fetchActivityDeleteSummary(
  courseId: string,
): Promise<ActivityDeleteSummaryResult> {
  try {
    const supabase = await getAuthedClient();
    if (!supabase) {
      return { success: false, error: "Supabase 尚未設定，無法讀取活動資料" };
    }

    const summary = await getActivityDeleteSummary(supabase, courseId);
    if (!summary) {
      return { success: false, error: "找不到活動" };
    }

    return { success: true, summary };
  } catch (error) {
    console.error("[fetchActivityDeleteSummary] failed:", courseId, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "讀取活動資料失敗",
    };
  }
}

export async function archiveActivityAction(
  courseId: string,
): Promise<AdminActionResult> {
  const parsed = archiveActivitySchema.safeParse({ courseId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "參數有誤",
    };
  }

  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定，無法封存活動" };
  }

  const result = await archiveActivity(supabase, parsed.data.courseId);
  if (!result.success) return result;

  revalidateActivityPaths(parsed.data.courseId);
  return { success: true };
}

export async function deleteActivityCascadeAction(input: {
  courseId: string;
  confirmation: string;
}): Promise<AdminActionResult> {
  const parsed = deleteActivityCascadeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "參數有誤",
    };
  }

  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定，無法刪除活動" };
  }

  try {
    const result = await deleteActivityCascade(supabase, parsed.data.courseId);
    if (!result.success) return result;

    revalidateActivityPaths(parsed.data.courseId);
    return { success: true };
  } catch (error) {
    console.error("[deleteActivityCascadeAction] Unexpected error:", error);
    return {
      success: false,
      error: `刪除活動失敗：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function archiveActivitiesBatchAction(
  courseIds: string[],
): Promise<AdminActionResult & { processedCount?: number }> {
  const parsed = archiveActivitiesBatchSchema.safeParse({ courseIds });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "參數有誤",
    };
  }

  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定，無法封存活動" };
  }

  for (const courseId of parsed.data.courseIds) {
    const result = await archiveActivity(supabase, courseId);
    if (!result.success) {
      return { success: false, error: result.error ?? "封存活動失敗" };
    }
  }

  for (const courseId of parsed.data.courseIds) {
    revalidateActivityPaths(courseId);
  }

  return { success: true, processedCount: parsed.data.courseIds.length };
}

export async function deleteActivitiesBatchAction(input: {
  courseIds: string[];
  confirmation: string;
}): Promise<AdminActionResult & { processedCount?: number }> {
  const parsed = deleteActivitiesBatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "參數有誤",
    };
  }

  const supabase = await getAuthedClient();
  if (!supabase) {
    return { success: false, error: "Supabase 尚未設定，無法刪除活動" };
  }

  for (const courseId of parsed.data.courseIds) {
    const result = await deleteActivityCascade(supabase, courseId);
    if (!result.success) {
      return { success: false, error: result.error ?? "永久刪除失敗" };
    }
  }

  for (const courseId of parsed.data.courseIds) {
    revalidateActivityPaths(courseId);
  }

  return { success: true, processedCount: parsed.data.courseIds.length };
}
