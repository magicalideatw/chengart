import { getClassById, getClassesByCourseId } from "@/lib/classes/queries";
import type { CourseClass } from "@/lib/classes/types";
import { getCourseById } from "@/lib/courses/queries";
import type { Course } from "@/lib/courses/types";
import { mapSessionRow } from "@/lib/sessions/mappers";
import { getEnrollmentCountsBySessionIds } from "@/lib/sessions/enrollment";
import { getSessionsByClassId } from "@/lib/sessions/queries";
import { formatSessionCheckboxLabel } from "@/lib/sessions/format";
import type { ClassSession } from "@/lib/sessions/types";
import { createPaymentClient, isSupabaseConfigured } from "@/lib/supabase";
import { isSessionSelectable } from "@/lib/registration/session-utils";

export { isSessionSelectable };

export type ClassWithSessionsOption = {
  class: CourseClass;
  sessions: ClassSession[];
  unitPrice: number;
};

export type CourseRegistrationPlan = {
  usesSessions: boolean;
  classes: ClassWithSessionsOption[];
  defaultUnitPrice: number;
  hasSelectableSessions: boolean;
};

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getSessionUnitPrice(courseClass: CourseClass, course: Course): number {
  return courseClass.fee ?? course.fee;
}

export async function getCourseRegistrationPlan(
  courseId: string,
): Promise<CourseRegistrationPlan | null> {
  const course = await getCourseById(courseId);
  if (!course) return null;

  const classes = await getClassesByCourseId(courseId);
  const openClasses = classes.filter((courseClass) => courseClass.isOpen);
  const today = todayIsoDate();

  const classOptions = await Promise.all(
    openClasses.map(async (courseClass) => {
      const sessions = (await getSessionsByClassId(courseClass.id)).filter(
        (session) => session.date >= today,
      );

      return {
        class: courseClass,
        sessions,
        unitPrice: getSessionUnitPrice(courseClass, course),
      };
    }),
  );

  const classesWithSessions = classOptions.filter((item) => item.sessions.length > 0);
  const usesSessions = classesWithSessions.length > 0;
  const hasSelectableSessions = classesWithSessions.some((item) =>
    item.sessions.some(isSessionSelectable),
  );

  return {
    usesSessions,
    classes: classesWithSessions,
    defaultUnitPrice: course.fee,
    hasSelectableSessions,
  };
}

export type ValidatedSessionSelection = {
  sessions: ClassSession[];
  classMap: Map<string, CourseClass>;
  unitPrices: Map<string, number>;
  totalAmount: number;
  sessionSummaries: string[];
};

export async function validateSessionSelection(
  courseId: string,
  sessionIds: string[],
): Promise<
  | { success: true; data: ValidatedSessionSelection }
  | { success: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  if (sessionIds.length === 0) {
    return { success: false, error: "請至少選擇一堂上課日期" };
  }

  const uniqueIds = [...new Set(sessionIds)];
  if (uniqueIds.length !== sessionIds.length) {
    return { success: false, error: "不可重複選擇相同的上課日期" };
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return { success: false, error: "找不到此課程" };
  }

  const supabase = createPaymentClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .in("id", uniqueIds);

  if (error) {
    console.error("Failed to validate sessions:", error.message);
    return { success: false, error: "無法驗證上課日期，請稍後再試" };
  }

  if (!data || data.length !== uniqueIds.length) {
    return { success: false, error: "部分上課日期不存在，請重新整理後再試" };
  }

  const enrollmentCounts = await getEnrollmentCountsBySessionIds(uniqueIds);
  const sessions = data.map((row) =>
    mapSessionRow(row, enrollmentCounts[String(row.id)] ?? 0),
  );
  const classMap = new Map<string, CourseClass>();
  const unitPrices = new Map<string, number>();
  let totalAmount = 0;

  for (const session of sessions) {
    if (!isSessionSelectable(session)) {
      if (session.status === "cancelled") {
        return { success: false, error: "所選日期含老師請假時段，請重新選擇" };
      }
      if (session.status === "full" || session.remainingCapacity <= 0) {
        return { success: false, error: "所選日期已額滿，請重新選擇" };
      }
      return { success: false, error: "所選日期目前不可報名，請重新選擇" };
    }

    let courseClass = classMap.get(session.classId);
    if (!courseClass) {
      const fetchedClass = await getClassById(session.classId);
      if (!fetchedClass || fetchedClass.courseId !== courseId) {
        return { success: false, error: "所選班別不屬於此課程" };
      }
      if (!fetchedClass.isOpen) {
        return { success: false, error: "所選班別目前未開放報名" };
      }
      courseClass = fetchedClass;
      classMap.set(session.classId, courseClass);
    }

    const unitPrice = getSessionUnitPrice(courseClass, course);
    unitPrices.set(session.id, unitPrice);
    totalAmount += unitPrice;
  }

  const sessionSummaries = sessions
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((session) => {
      const courseClass = classMap.get(session.classId);
      return `${courseClass?.name ?? "班別"} ${formatSessionCheckboxLabel(session.date)} ${session.startTime}~${session.endTime}`;
    });

  return {
    success: true,
    data: {
      sessions: sessions.sort((a, b) => a.date.localeCompare(b.date)),
      classMap,
      unitPrices,
      totalAmount,
      sessionSummaries,
    },
  };
}
