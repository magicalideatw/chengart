"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getCourseById } from "@/lib/courses/queries";
import { generateWeekdayDates } from "@/lib/sessions/generate-dates";
import { mapSessionToDb } from "@/lib/sessions/mappers";
import { getEnrollmentCountForSession } from "@/lib/sessions/enrollment";
import { getSessionsByCourseId } from "@/lib/sessions/queries";
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
    error: "Supabase 尚未設定，無法操作場次",
  };
}

function tableMissingMessage(): AdminActionResult {
  return {
    success: false,
    error: "請先在 Supabase 執行 036_sessions_unified.sql",
  };
}

async function getMutationClient() {
  if (!isSupabaseConfigured()) return null;
  return createServerClient();
}

function revalidateCourseSessionPaths(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}/sessions`);
  revalidatePath(`/admin/courses/${courseId}/classes`);
  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${courseId}`);
}

async function getCourseContext(courseId: string): Promise<
  | { course: NonNullable<Awaited<ReturnType<typeof getCourseById>>> }
  | { error: AdminActionResult }
> {
  const course = await getCourseById(courseId);
  if (!course) {
    return { error: { success: false, error: "找不到此活動" } };
  }
  return { course };
}

export async function createCourseSession(
  courseId: string,
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

  const context = await getCourseContext(courseId);
  if ("error" in context) return context.error;

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("sessions")
    .insert(mapSessionToDb(courseId, parsed.data, 0));

  if (error) {
    console.error("Create course session failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    if (error.code === "23505") {
      return { success: false, error: "此日期與時間已存在，請改用其他設定" };
    }
    return { success: false, error: "新增場次失敗，請稍後再試" };
  }

  revalidateCourseSessionPaths(courseId);
  return { success: true };
}

export async function updateCourseSession(
  courseId: string,
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

  const context = await getCourseContext(courseId);
  if ("error" in context) return context.error;

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const enrolledCount = await getEnrollmentCountForSession(sessionId);

  const { error } = await supabase
    .from("sessions")
    .update(mapSessionToDb(courseId, parsed.data, enrolledCount))
    .eq("id", sessionId)
    .eq("course_id", courseId);

  if (error) {
    console.error("Update course session failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    if (error.code === "23505") {
      return { success: false, error: "此日期與時間已存在，請改用其他設定" };
    }
    return { success: false, error: "更新場次失敗，請稍後再試" };
  }

  revalidateCourseSessionPaths(courseId);
  return { success: true };
}

export async function deleteCourseSession(
  courseId: string,
  sessionId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const context = await getCourseContext(courseId);
  if ("error" in context) return context.error;

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("course_id", courseId);

  if (error) {
    console.error("Delete course session failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    return { success: false, error: "刪除場次失敗，請稍後再試" };
  }

  revalidateCourseSessionPaths(courseId);
  return { success: true };
}

export async function bulkGenerateCourseSessions(
  courseId: string,
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

  const context = await getCourseContext(courseId);
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

  const existingSessions = await getSessionsByCourseId(courseId);
  const existingKeys = new Set(
    existingSessions.map((session) => `${session.date}|${session.startTime}`),
  );

  const startTime = parsed.data.startTime?.trim() || "14:00";
  const endTime = parsed.data.endTime?.trim() || "15:30";
  const name = parsed.data.name?.trim() || "場次";
  const capacity = parsed.data.capacity ?? 5;
  const price = parsed.data.price ?? context.course.fee ?? 0;

  const newDates = dates.filter(
    (date) => !existingKeys.has(`${date}|${startTime}`),
  );
  const skipped = dates.length - newDates.length;

  if (newDates.length === 0) {
    return {
      success: false,
      error: "所有日期皆已存在，未新增任何場次",
      skipped,
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const rows = newDates.map((date, index) =>
    mapSessionToDb(
      courseId,
      {
        name,
        sessionType: "fixed",
        date,
        startTime,
        endTime,
        capacity,
        remainingCapacity: capacity,
        price,
        location: "",
        isOpen: true,
        sortOrder: index,
        status: "open",
        notes: "",
      },
      0,
    ),
  );

  const { error } = await supabase.from("sessions").insert(rows);

  if (error) {
    console.error("Bulk generate course sessions failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    return { success: false, error: "快速建立場次失敗，請稍後再試" };
  }

  revalidateCourseSessionPaths(courseId);
  return {
    success: true,
    created: newDates.length,
    skipped,
  };
}
