"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getClassById } from "@/lib/classes/queries";
import { generateWeekdayDates } from "@/lib/sessions/generate-dates";
import { mapSessionToDb } from "@/lib/sessions/mappers";
import { getEnrollmentCountForSession } from "@/lib/sessions/enrollment";
import { getSessionDatesByClassId } from "@/lib/sessions/queries";
import type {
  BulkGenerateSessionsInput,
  SessionFormInput,
} from "@/lib/sessions/types";
import type { AdminActionResult } from "@/lib/admin/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  adminSessionBulkSchema,
  adminSessionSchema,
} from "@/lib/validation/admin-session-schema";

type BulkGenerateResult = AdminActionResult & {
  created?: number;
  skipped?: number;
};

function mutationUnavailable(): AdminActionResult {
  return {
    success: false,
    error: "Supabase 尚未設定，無法操作上課日期",
  };
}

function tableMissingMessage(): AdminActionResult {
  return {
    success: false,
    error: "請先在 Supabase 執行 012_create_sessions.sql",
  };
}

async function getMutationClient() {
  if (!isSupabaseConfigured()) return null;
  return createServerClient();
}

function revalidateSessionPaths(classId: string, courseId?: string) {
  revalidatePath(`/admin/classes/${classId}/sessions`);
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}/classes`);
    revalidatePath("/admin/courses");
  }
}

async function getClassContext(classId: string): Promise<
  | { courseClass: NonNullable<Awaited<ReturnType<typeof getClassById>>> }
  | { error: AdminActionResult }
> {
  const courseClass = await getClassById(classId);
  if (!courseClass) {
    return { error: { success: false, error: "找不到此班別" } };
  }
  return { courseClass };
}

export async function createSession(
  classId: string,
  input: SessionFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminSessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const context = await getClassContext(classId);
  if ("error" in context) return context.error;

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("sessions")
    .insert(mapSessionToDb(classId, parsed.data, 0));

  if (error) {
    console.error("Create session failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    if (error.code === "23505") {
      return { success: false, error: "此日期已存在，請改用其他日期" };
    }
    if (error.code === "23503") {
      return { success: false, error: "找不到此班別" };
    }
    return { success: false, error: "新增上課日期失敗，請稍後再試" };
  }

  revalidateSessionPaths(classId, context.courseClass.courseId);
  return { success: true };
}

export async function updateSession(
  classId: string,
  sessionId: string,
  input: SessionFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminSessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const context = await getClassContext(classId);
  if ("error" in context) return context.error;

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const enrolledCount = await getEnrollmentCountForSession(sessionId);

  const { error } = await supabase
    .from("sessions")
    .update(mapSessionToDb(classId, parsed.data, enrolledCount))
    .eq("id", sessionId)
    .eq("class_id", classId);

  if (error) {
    console.error("Update session failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    if (error.code === "23505") {
      return { success: false, error: "此日期已存在，請改用其他日期" };
    }
    return { success: false, error: "更新上課日期失敗，請稍後再試" };
  }

  revalidateSessionPaths(classId, context.courseClass.courseId);
  return { success: true };
}

export async function deleteSession(
  classId: string,
  sessionId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const context = await getClassContext(classId);
  if ("error" in context) return context.error;

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("class_id", classId);

  if (error) {
    console.error("Delete session failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    return { success: false, error: "刪除上課日期失敗，請稍後再試" };
  }

  revalidateSessionPaths(classId, context.courseClass.courseId);
  return { success: true };
}

export async function bulkGenerateSessions(
  classId: string,
  input: BulkGenerateSessionsInput,
): Promise<BulkGenerateResult> {
  await requireAuthenticatedUser();

  const parsed = adminSessionBulkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const context = await getClassContext(classId);
  if ("error" in context) return context.error;

  const dates = generateWeekdayDates(
    parsed.data.weekday,
    parsed.data.startDate,
    parsed.data.endDate,
  );

  if (dates.length === 0) {
    return {
      success: false,
      error: "找不到符合條件的日期，請確認星期與日期範圍",
    };
  }

  const existingDates = await getSessionDatesByClassId(classId);
  const newDates = dates.filter((date) => !existingDates.has(date));
  const skipped = dates.length - newDates.length;

  if (newDates.length === 0) {
    return {
      success: false,
      error: "所有日期皆已存在，未新增任何上課日期",
      skipped,
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const rows = newDates.map((date) => ({
    class_id: classId,
    date,
    start_time: context.courseClass.startTime,
    end_time: context.courseClass.endTime,
    capacity: context.courseClass.capacity,
    remaining_capacity: context.courseClass.capacity,
    status: "open" as const,
    notes: "",
  }));

  const { error } = await supabase.from("sessions").insert(rows);

  if (error) {
    console.error("Bulk generate sessions failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    return { success: false, error: "快速建立日期失敗，請稍後再試" };
  }

  revalidateSessionPaths(classId, context.courseClass.courseId);
  return {
    success: true,
    created: newDates.length,
    skipped,
  };
}
