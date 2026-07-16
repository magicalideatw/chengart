"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import { ATTENDANCE_STATUSES } from "@/lib/attendance/types";
import { getSessionAttendanceContext } from "@/lib/attendance/queries";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

const attendanceEntrySchema = z.object({
  studentId: z.string().uuid("學生 ID 格式有誤"),
  registrationId: z.string().uuid().nullable().optional(),
  status: z.enum(ATTENDANCE_STATUSES),
  note: z.string().max(500).nullable().optional(),
});

const saveSessionAttendanceSchema = z.object({
  sessionId: z.string().uuid("上課日期 ID 格式有誤"),
  entries: z.array(attendanceEntrySchema),
  clearStudentIds: z.array(z.string().uuid()).optional(),
});

function revalidateAttendancePaths(sessionId: string, courseId?: string) {
  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/attendance/sessions/${sessionId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  if (courseId) {
    revalidatePath(`/admin/attendance/courses/${courseId}`);
  }
}

export async function saveSessionAttendance(input: {
  sessionId: string;
  entries: Array<{
    studentId: string;
    registrationId?: string | null;
    status: (typeof ATTENDANCE_STATUSES)[number];
    note?: string | null;
  }>;
  clearStudentIds?: string[];
}): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = saveSessionAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "資料格式有誤",
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const context = await getSessionAttendanceContext(parsed.data.sessionId);
  if (!context) {
    return { success: false, error: "找不到上課日期" };
  }

  const rosterStudentIds = new Set(context.roster.map((student) => student.studentId));
  for (const entry of parsed.data.entries) {
    if (!rosterStudentIds.has(entry.studentId)) {
      return { success: false, error: "包含不在名單內的學生" };
    }
  }

  const supabase = await createServerClient();
  const now = new Date().toISOString();

  if (parsed.data.clearStudentIds?.length) {
    const { error: deleteError } = await supabase
      .from("attendance")
      .delete()
      .eq("session_id", parsed.data.sessionId)
      .in("student_id", parsed.data.clearStudentIds);

    if (deleteError) {
      console.error("Failed to clear attendance:", deleteError.message);
      return { success: false, error: "清除點名紀錄失敗" };
    }
  }

  if (parsed.data.entries.length === 0) {
    revalidateAttendancePaths(parsed.data.sessionId, context.courseId);
    return { success: true };
  }

  const payload = parsed.data.entries.map((entry) => ({
    session_id: parsed.data.sessionId,
    student_id: entry.studentId,
    registration_id: entry.registrationId ?? null,
    status: entry.status,
    note: entry.note?.trim() || null,
    marked_at: now,
    updated_at: now,
  }));

  const { error } = await supabase.from("attendance").upsert(payload, {
    onConflict: "session_id,student_id",
  });

  if (error) {
    if (error.code === "PGRST205") {
      return {
        success: false,
        error: "請先在 Supabase 執行 027_attendance.sql",
      };
    }

    console.error("Failed to save attendance:", error.message);
    return { success: false, error: "儲存點名失敗" };
  }

  revalidateAttendancePaths(parsed.data.sessionId, context.courseId);
  return { success: true };
}
