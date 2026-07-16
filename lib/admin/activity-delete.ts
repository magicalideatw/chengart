import { getCourseById } from "@/lib/courses/queries";
import type { ActivityType } from "@/lib/courses/activity-type";
import { getClassesByCourseId } from "@/lib/classes/queries";
import { isPerformanceOrderFormData } from "@/lib/orders/order-form-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  formatSupabaseError,
  logDeleteStep,
  mutationError,
  type MutationResult,
  type PostgrestErrorLike,
} from "@/lib/admin/delete-utils";
import { deleteOrdersByCourseId } from "@/lib/admin/order-delete";

const SCOPE = "deleteActivityCascade";

export type ActivityDeleteSummary = {
  courseId: string;
  title: string;
  activityType: ActivityType;
  registrationCount: number;
  performanceOrderCount: number;
  orderCount: number;
  sessionCount: number;
  ticketTypeCount: number;
};

type Supabase = SupabaseClient<Database>;

export async function getActivityDeleteSummary(
  supabase: Supabase,
  courseId: string,
): Promise<ActivityDeleteSummary | null> {
  const course = await getCourseById(courseId);
  if (!course) return null;

  const [
    registrationsResult,
    ordersResult,
    ticketTypesResult,
    classes,
  ] = await Promise.all([
    supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId),
    supabase.from("orders").select("id, form_data").eq("course_id", courseId),
    supabase
      .from("ticket_types")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId),
    getClassesByCourseId(courseId),
  ]);

  const classIds = classes.map((courseClass) => courseClass.id);
  let sessionCount = 0;

  if (classIds.length > 0) {
    const { count, error } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .in("class_id", classIds);

    if (!error) {
      sessionCount = count ?? 0;
    }
  }

  const orders = ordersResult.data ?? [];
  const performanceOrderCount = orders.filter((order) =>
    isPerformanceOrderFormData(
      (order.form_data ?? {}) as Record<string, unknown>,
    ),
  ).length;

  return {
    courseId: course.id,
    title: course.title,
    activityType: course.activityType,
    registrationCount: registrationsResult.count ?? 0,
    performanceOrderCount,
    orderCount: orders.length,
    sessionCount,
    ticketTypeCount: ticketTypesResult.count ?? 0,
  };
}

export async function archiveActivity(
  supabase: Supabase,
  courseId: string,
): Promise<MutationResult> {
  const course = await getCourseById(courseId);
  if (!course) {
    return { success: false, error: "找不到活動" };
  }

  const { error } = await supabase
    .from("courses")
    .update({
      is_open: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    return mutationError(SCOPE, "Archive Course", "封存活動失敗，請稍後再試", error);
  }

  return { success: true };
}

async function deleteAttendanceForActivity(
  supabase: Supabase,
  input: {
    sessionIds: string[];
    registrationIds: string[];
    studentIds: string[];
  },
): Promise<MutationResult> {
  logDeleteStep(SCOPE, "Deleting Attendance (by session)", "start");
  if (input.sessionIds.length > 0) {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .in("session_id", input.sessionIds);
    if (error) {
      return mutationError(SCOPE, "Deleting Attendance (by session)", "刪除出席紀錄失敗", error);
    }
  }
  logDeleteStep(SCOPE, "Deleting Attendance (by session)", "ok");

  logDeleteStep(SCOPE, "Deleting Attendance (by registration)", "start");
  if (input.registrationIds.length > 0) {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .in("registration_id", input.registrationIds);
    if (error) {
      return mutationError(
        SCOPE,
        "Deleting Attendance (by registration)",
        "刪除出席紀錄失敗",
        error,
      );
    }
  }
  logDeleteStep(SCOPE, "Deleting Attendance (by registration)", "ok");

  logDeleteStep(SCOPE, "Deleting Attendance (by student)", "start");
  if (input.studentIds.length > 0) {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .in("student_id", input.studentIds);
    if (error) {
      return mutationError(SCOPE, "Deleting Attendance (by student)", "刪除出席紀錄失敗", error);
    }
  }
  logDeleteStep(SCOPE, "Deleting Attendance (by student)", "ok");

  return { success: true };
}

type CourseDependencyCounts = {
  orders: number;
  registrations: number;
  classes: number;
  sessions: number;
  ticket_types: number;
  promo_codes: number;
};

const COURSE_DEPENDENCY_LABELS: Record<keyof CourseDependencyCounts, string> = {
  orders: "orders",
  registrations: "registrations",
  classes: "classes",
  sessions: "sessions",
  ticket_types: "ticket_types",
  promo_codes: "promo_codes",
};

function formatRemainingDependenciesMessage(counts: CourseDependencyCounts): string {
  const lines = (Object.keys(COURSE_DEPENDENCY_LABELS) as Array<keyof CourseDependencyCounts>)
    .filter((key) => counts[key] > 0)
    .map((key) => `${COURSE_DEPENDENCY_LABELS[key]}：${counts[key]} 筆`);

  return ["尚有相依資料未刪除", ...lines].join("\n");
}

async function countExact(
  supabase: Supabase,
  table: "orders" | "registrations" | "classes" | "ticket_types" | "promo_codes",
  courseId: string,
): Promise<{ count: number; error: PostgrestErrorLike | null }> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  return { count: count ?? 0, error };
}

async function countRemainingCourseDependencies(
  supabase: Supabase,
  courseId: string,
): Promise<
  | { success: true; counts: CourseDependencyCounts }
  | { success: false; error: string; cause?: PostgrestErrorLike | null }
> {
  const [
    ordersResult,
    registrationsResult,
    classesResult,
    ticketTypesResult,
    promoCodesResult,
  ] = await Promise.all([
    countExact(supabase, "orders", courseId),
    countExact(supabase, "registrations", courseId),
    countExact(supabase, "classes", courseId),
    countExact(supabase, "ticket_types", courseId),
    countExact(supabase, "promo_codes", courseId),
  ]);

  const firstError =
    ordersResult.error ??
    registrationsResult.error ??
    classesResult.error ??
    ticketTypesResult.error ??
    promoCodesResult.error;

  if (firstError) {
    return {
      success: false,
      error: "驗證相依資料失敗",
      cause: firstError,
    };
  }

  const { data: classRows, error: classesQueryError } = await supabase
    .from("classes")
    .select("id")
    .eq("course_id", courseId);

  if (classesQueryError) {
    return {
      success: false,
      error: "驗證 Session 資料失敗",
      cause: classesQueryError,
    };
  }

  const classIds = (classRows ?? []).map((row) => String(row.id));
  let sessionCount = 0;

  if (classIds.length > 0) {
    const { count, error: sessionsError } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .in("class_id", classIds);

    if (sessionsError) {
      return {
        success: false,
        error: "驗證 Session 資料失敗",
        cause: sessionsError,
      };
    }

    sessionCount = count ?? 0;
  }

  return {
    success: true,
    counts: {
      orders: ordersResult.count,
      registrations: registrationsResult.count,
      classes: classesResult.count,
      sessions: sessionCount,
      ticket_types: ticketTypesResult.count,
      promo_codes: promoCodesResult.count,
    },
  };
}

async function verifyNoRemainingCourseDependencies(
  supabase: Supabase,
  courseId: string,
): Promise<MutationResult> {
  logDeleteStep(SCOPE, "Verifying Course Dependencies", "start");

  const result = await countRemainingCourseDependencies(supabase, courseId);
  if (!result.success) {
    return mutationError(
      SCOPE,
      "Verifying Course Dependencies",
      result.error,
      result.cause ?? undefined,
    );
  }

  const remainingTotal = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
  if (remainingTotal > 0) {
    const message = formatRemainingDependenciesMessage(result.counts);
    logDeleteStep(SCOPE, "Verifying Course Dependencies", "fail", message.replace(/\n/g, " | "));
    console.error(`[${SCOPE}] Remaining dependencies:`, result.counts);
    return { success: false, error: message };
  }

  logDeleteStep(SCOPE, "Verifying Course Dependencies", "ok");
  return { success: true };
}

export async function deleteActivityCascade(
  supabase: Supabase,
  courseId: string,
): Promise<MutationResult> {
  try {
    console.log(`[${SCOPE}] 目前正在刪除 Course: ${courseId}`);

    const course = await getCourseById(courseId);
    if (!course) {
      return { success: false, error: "刪除活動失敗：找不到活動" };
    }

    console.log(`[${SCOPE}] Course title: ${course.title}`);

    logDeleteStep(SCOPE, "Loading Registrations", "start");
    const { data: registrationRows, error: registrationsQueryError } = await supabase
      .from("registrations")
      .select("id, student_id")
      .eq("course_id", courseId);

    if (registrationsQueryError) {
      return mutationError(
        SCOPE,
        "Loading Registrations",
        "讀取報名資料失敗",
        registrationsQueryError,
      );
    }
    logDeleteStep(SCOPE, "Loading Registrations", "ok");

    const registrationIds = (registrationRows ?? []).map((row) => String(row.id));
    const registrationStudentIds = (registrationRows ?? [])
      .map((row) => (row.student_id ? String(row.student_id) : null))
      .filter((value): value is string => Boolean(value));
    console.log(`[${SCOPE}] Registration count: ${registrationIds.length}`);

    const classes = await getClassesByCourseId(courseId);
    const classIds = classes.map((courseClass) => courseClass.id);

    let sessionIds: string[] = [];
    logDeleteStep(SCOPE, "Loading Sessions", "start");
    if (classIds.length > 0) {
      const { data: sessionRows, error: sessionsQueryError } = await supabase
        .from("sessions")
        .select("id")
        .in("class_id", classIds);

      if (sessionsQueryError) {
        return mutationError(SCOPE, "Loading Sessions", "讀取 Session 資料失敗", sessionsQueryError);
      }

      sessionIds = (sessionRows ?? []).map((row) => String(row.id));
    }
    logDeleteStep(SCOPE, "Loading Sessions", "ok");
    console.log(`[${SCOPE}] Session count: ${sessionIds.length}`);

    logDeleteStep(SCOPE, "Loading Students", "start");
    const { data: orderRows } = await supabase
      .from("orders")
      .select("id")
      .eq("course_id", courseId);
    const orderIds = (orderRows ?? []).map((row) => String(row.id));

    let orderStudentIds: string[] = [];
    if (orderIds.length > 0) {
      const { data: studentRows, error: studentsQueryError } = await supabase
        .from("students")
        .select("id")
        .in("order_id", orderIds);

      if (studentsQueryError) {
        return mutationError(SCOPE, "Loading Students", "讀取學生資料失敗", studentsQueryError);
      }

      orderStudentIds = (studentRows ?? []).map((row) => String(row.id));
    }
    logDeleteStep(SCOPE, "Loading Students", "ok");

    const studentIds = [...new Set([...registrationStudentIds, ...orderStudentIds])];
    console.log(`[${SCOPE}] Student count: ${studentIds.length}`);

    const attendanceResult = await deleteAttendanceForActivity(supabase, {
      sessionIds,
      registrationIds,
      studentIds,
    });
    if (!attendanceResult.success) return attendanceResult;

    logDeleteStep(SCOPE, "Deleting Registrations", "start");
    const { error: registrationsDeleteError } = await supabase
      .from("registrations")
      .delete()
      .eq("course_id", courseId);
    if (registrationsDeleteError) {
      return mutationError(
        SCOPE,
        "Deleting Registrations",
        "刪除報名資料失敗",
        registrationsDeleteError,
      );
    }
    logDeleteStep(SCOPE, "Deleting Registrations", "ok");

    const ordersResult = await deleteOrdersByCourseId(supabase, courseId, { scope: SCOPE });
    if (!ordersResult.success) {
      return { success: false, error: ordersResult.error };
    }

    logDeleteStep(SCOPE, "Deleting Sessions", "start");
    if (sessionIds.length > 0) {
      const { error: sessionsDeleteError } = await supabase
        .from("sessions")
        .delete()
        .in("id", sessionIds);
      if (sessionsDeleteError) {
        return mutationError(SCOPE, "Deleting Sessions", "刪除 Session 失敗", sessionsDeleteError);
      }
    }
    logDeleteStep(SCOPE, "Deleting Sessions", "ok");

    logDeleteStep(SCOPE, "Deleting Classes", "start");
    if (classIds.length > 0) {
      const { error: classesDeleteError } = await supabase
        .from("classes")
        .delete()
        .eq("course_id", courseId);
      if (classesDeleteError) {
        return mutationError(SCOPE, "Deleting Classes", "刪除班別失敗", classesDeleteError);
      }
    }
    logDeleteStep(SCOPE, "Deleting Classes", "ok");

    logDeleteStep(SCOPE, "Deleting Ticket Types", "start");
    const { error: ticketTypesError } = await supabase
      .from("ticket_types")
      .delete()
      .eq("course_id", courseId);
    if (ticketTypesError) {
      return mutationError(SCOPE, "Deleting Ticket Types", "刪除票種失敗", ticketTypesError);
    }
    logDeleteStep(SCOPE, "Deleting Ticket Types", "ok");

    logDeleteStep(SCOPE, "Deleting Promo Codes", "start");
    const { error: promoCodesError } = await supabase
      .from("promo_codes")
      .delete()
      .eq("course_id", courseId);
    if (promoCodesError) {
      return mutationError(SCOPE, "Deleting Promo Codes", "刪除折扣碼失敗", promoCodesError);
    }
    logDeleteStep(SCOPE, "Deleting Promo Codes", "ok");

    const dependenciesVerifyResult = await verifyNoRemainingCourseDependencies(
      supabase,
      courseId,
    );
    if (!dependenciesVerifyResult.success) return dependenciesVerifyResult;

    logDeleteStep(SCOPE, "Deleting Course", "start");
    const { error: courseError } = await supabase.from("courses").delete().eq("id", courseId);
    if (courseError) {
      return mutationError(SCOPE, "Deleting Course", "刪除活動失敗", courseError);
    }
    logDeleteStep(SCOPE, "Deleting Course", "ok");

    console.log(`[${SCOPE}] ✓ Course ${courseId} deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error(`[${SCOPE}] Unexpected error:`, error);
    return {
      success: false,
      error: `刪除活動失敗：${formatSupabaseError(error)}`,
    };
  }
}
