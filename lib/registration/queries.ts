import { getCourseById } from "@/lib/courses/queries";
import type { Course } from "@/lib/courses/types";
import { mapSessionRow } from "@/lib/sessions/mappers";
import { getEnrollmentCountsBySessionIds } from "@/lib/sessions/enrollment";
import {
  getCourseSessionRadioOptions,
  getSessionUnitPrice,
  type ClassWithSessionsOption,
  type CourseRegistrationPlanShape,
  planToLegacyClassOptions,
} from "@/lib/registration/plan-utils";
import { getOpenSessionsByCourseId } from "@/lib/sessions/queries";
import {
  formatSessionCheckboxLabel,
  formatCourseSessionSelectionLabel,
  isSelfScheduledSession,
} from "@/lib/sessions/format";
import type { ClassSession } from "@/lib/sessions/types";
import { createPaymentClient, isSupabaseConfigured } from "@/lib/supabase";
import { isSessionSelectable } from "@/lib/sessions/session-utils";
import { getVisibleCoursePlansByCourseId, getCoursePlanById } from "@/lib/course-plans/queries";
import type { CoursePlan } from "@/lib/course-plans/types";
import { formatCoursePlanLabel } from "@/lib/course-plans/mappers";

export { isSessionSelectable };

export type CourseRegistrationPlan = CourseRegistrationPlanShape;

export { planToLegacyClassOptions, type ClassWithSessionsOption };

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getCourseRegistrationPlan(
  courseId: string,
): Promise<CourseRegistrationPlan | null> {
  const course = await getCourseById(courseId);
  if (!course) return null;

  const today = todayIsoDate();
  const [sessions, coursePlans] = await Promise.all([
    getOpenSessionsByCourseId(courseId, { fromDate: today }),
    getVisibleCoursePlansByCourseId(courseId),
  ]);
  const courseSessionOptions = getCourseSessionRadioOptions(sessions);
  const selfScheduledOptions = courseSessionOptions.filter(isSelfScheduledSession);
  const usesCoursePlans = selfScheduledOptions.length > 0 && coursePlans.length > 0;
  const usesSessions = usesCoursePlans || courseSessionOptions.length > 0;
  const hasSelectableSessions = usesCoursePlans
    ? true
    : courseSessionOptions.some(isSessionSelectable);

  return {
    usesSessions,
    usesCoursePlans,
    sessions,
    courseSessionOptions,
    coursePlans,
    primarySelfScheduledSessionId: selfScheduledOptions[0]?.id ?? null,
    defaultUnitPrice: course.fee,
    hasSelectableSessions,
  };
}

export type ValidatedSessionSelection = {
  sessions: ClassSession[];
  unitPrices: Map<string, number>;
  totalAmount: number;
  sessionSummaries: string[];
};

export async function validateSessionSelection(
  courseId: string,
  sessionIds: string[],
  course?: Course | null,
): Promise<
  | { success: true; data: ValidatedSessionSelection }
  | { success: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  if (sessionIds.length === 0) {
    return { success: false, error: "請選擇班別" };
  }

  const uniqueIds = [...new Set(sessionIds)];
  if (uniqueIds.length !== sessionIds.length) {
    return { success: false, error: "不可重複選擇相同的班別" };
  }

  const resolvedCourse = course ?? (await getCourseById(courseId));
  if (!resolvedCourse) {
    return { success: false, error: "找不到此課程" };
  }

  const supabase = createPaymentClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .in("id", uniqueIds);

  if (error) {
    console.error("Failed to validate sessions:", error.message);
    return { success: false, error: "無法驗證班別，請稍後再試" };
  }

  if (!data || data.length !== uniqueIds.length) {
    return { success: false, error: "部分班別不存在，請重新整理後再試" };
  }

  const enrollmentCounts = await getEnrollmentCountsBySessionIds(uniqueIds);
  const sessions = data.map((row) =>
    mapSessionRow(row, enrollmentCounts[String(row.id)] ?? 0),
  );
  const unitPrices = new Map<string, number>();
  let totalAmount = 0;

  for (const session of sessions) {
    if (session.courseId !== courseId) {
      return { success: false, error: "所選班別不屬於此課程" };
    }

    if (!isSessionSelectable(session)) {
      if (session.status === "cancelled") {
        return { success: false, error: "所選班別含已取消時段，請重新選擇" };
      }
      if (session.status === "full" || session.remainingCapacity <= 0) {
        return { success: false, error: "所選班別已額滿，請重新選擇" };
      }
      return { success: false, error: "所選班別目前不可報名，請重新選擇" };
    }

    const unitPrice = getSessionUnitPrice(session, resolvedCourse.fee);
    unitPrices.set(session.id, unitPrice);
    totalAmount += unitPrice;
  }

  const sessionSummaries = sessions
    .sort((a, b) => a.sortOrder - b.sortOrder || a.date.localeCompare(b.date))
    .map((session) => {
      if (isSelfScheduledSession(session)) {
        const label = session.name.trim() || "班別";
        return label;
      }
      const label = session.name.trim() || "班別";
      return `${label} ${formatSessionCheckboxLabel(session.date)} ${session.startTime}~${session.endTime}`;
    });

  return {
    success: true,
    data: {
      sessions: sessions.sort((a, b) => a.sortOrder - b.sortOrder || a.date.localeCompare(b.date)),
      unitPrices,
      totalAmount,
      sessionSummaries,
    },
  };
}

export async function validatePerformanceSessionSelection(
  courseId: string,
  sessionId: string,
): Promise<
  | { success: true; data: { session: ClassSession } }
  | { success: false; error: string }
> {
  if (!sessionId) {
    return { success: false, error: "請選擇場次" };
  }

  const result = await validateSessionSelection(courseId, [sessionId]);
  if (!result.success) {
    return result;
  }

  return { success: true, data: { session: result.data.sessions[0] } };
}

export async function validateCoursePlanSelection(
  courseId: string,
  planId: string,
): Promise<
  | { success: true; data: { plan: CoursePlan } }
  | { success: false; error: string }
> {
  if (!planId) {
    return { success: false, error: "請選擇課程方案" };
  }

  const plan = await getCoursePlanById(planId);
  if (!plan || plan.courseId !== courseId || !plan.isActive) {
    return { success: false, error: "所選課程方案不存在或已下架，請重新整理後再試" };
  }

  return { success: true, data: { plan } };
}

export function buildCoursePlanSessionSummary(plan: CoursePlan): string {
  return formatCoursePlanLabel(plan);
}
