import type { CourseFormInput } from "@/lib/courses/types";
import {
  formatCourseSessionTimeRange,
  parseCourseSessionTimeRange,
} from "@/lib/courses/session-time";
import { getEnrollmentCountForSession } from "@/lib/sessions/enrollment";
import { mapSessionToDb } from "@/lib/sessions/mappers";
import { getSessionsByCourseId } from "@/lib/sessions/queries";
import type { SessionFormInput } from "@/lib/sessions/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function buildPrimarySessionInput(
  courseId: string,
  input: CourseFormInput,
  primaryName: string,
  primary?: Awaited<ReturnType<typeof getSessionsByCourseId>>[number],
): SessionFormInput {
  const isSelfScheduled = input.scheduleMode === "self_scheduled";

  return {
    sessionType: input.scheduleMode,
    name: primaryName,
    date: isSelfScheduled ? "" : input.sessionDate,
    startTime: isSelfScheduled ? "" : input.sessionStartTime.trim(),
    endTime: isSelfScheduled ? "" : input.sessionEndTime.trim(),
    capacity: input.capacity,
    remainingCapacity: primary?.remainingCapacity ?? input.capacity,
    price: input.pricePerStudent,
    location: primary?.location ?? "",
    isOpen: input.isOpen,
    sortOrder: primary?.sortOrder ?? 0,
    status: primary?.status ?? "open",
    notes: primary?.notes ?? "",
  };
}

export async function syncPrimaryCourseSession(
  courseId: string,
  input: CourseFormInput,
): Promise<{ success: true } | { success: false; error: string }> {
  if (input.activityType === "performance" || input.participationMethod === "external") {
    return { success: true };
  }

  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const supabase = await createServerClient();
  const sessions = await getSessionsByCourseId(courseId);
  const primary = [...sessions].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
  )[0];

  const sessionInput = buildPrimarySessionInput(
    courseId,
    input,
    primary?.name.trim() || "預設班別",
    primary,
  );

  const enrolledCount = primary
    ? await getEnrollmentCountForSession(primary.id)
    : 0;

  const row = mapSessionToDb(courseId, sessionInput, enrolledCount);

  if (primary) {
    const { error } = await supabase
      .from("sessions")
      .update(row)
      .eq("id", primary.id)
      .eq("course_id", courseId);

    if (error) {
      console.error("Sync primary course session failed:", error.message);
      if (error.code === "PGRST205") {
        return { success: false, error: "請先在 Supabase 執行 036_sessions_unified.sql" };
      }
      return { success: false, error: "同步班別場次失敗，請稍後再試" };
    }

    return { success: true };
  }

  const { error } = await supabase.from("sessions").insert(row);

  if (error) {
    console.error("Create primary course session failed:", error.message);
    if (error.code === "PGRST205") {
      return { success: false, error: "請先在 Supabase 執行 036_sessions_unified.sql" };
    }
    if (error.code === "23505") {
      return { success: false, error: "此日期與時間已存在，請改用其他設定" };
    }
    return { success: false, error: "建立班別場次失敗，請稍後再試" };
  }

  return { success: true };
}

export function resolveCourseFormScheduleFromSessions(
  course: Pick<CourseFormInput, "sessionDate" | "sessionTime" | "scheduleMode">,
  sessions: Awaited<ReturnType<typeof getSessionsByCourseId>>,
): Pick<
  CourseFormInput,
  "scheduleMode" | "sessionDate" | "sessionStartTime" | "sessionEndTime" | "sessionTime"
> {
  const primary = [...sessions].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
  )[0];

  if (primary?.sessionType === "self_scheduled") {
    return {
      scheduleMode: "self_scheduled",
      sessionDate: "",
      sessionStartTime: "",
      sessionEndTime: "",
      sessionTime: "",
    };
  }

  if (primary) {
    return {
      scheduleMode: "fixed",
      sessionDate: primary.date || course.sessionDate,
      sessionStartTime: primary.startTime,
      sessionEndTime: primary.endTime,
      sessionTime: formatCourseSessionTimeRange(primary.startTime, primary.endTime),
    };
  }

  const { startTime, endTime } = parseCourseSessionTimeRange(course.sessionTime);

  return {
    scheduleMode: course.scheduleMode ?? "fixed",
    sessionDate: course.sessionDate,
    sessionStartTime: startTime,
    sessionEndTime: endTime,
    sessionTime: course.sessionTime,
  };
}
