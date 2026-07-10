import type { AdminRegistration, AdminSessionSlot } from "@/lib/admin/types";
import {
  formatAdminSessionDate,
  formatAdminSessionDetailLine,
  formatAdminSessionTimeRange,
  formatClassLabel,
} from "@/lib/admin/format";
import { mapCourseRow } from "@/lib/courses/mappers";
import { DEFAULT_MAX_CAPACITY } from "@/lib/registrations/availability";
import type { Database } from "@/lib/supabase/database.types";

type JoinedClass = {
  id: string;
  name: string;
  weekday: string;
};

type JoinedSession = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  classes: JoinedClass | JoinedClass[] | null;
};

export type RegistrationJoinRow =
  Database["public"]["Tables"]["registrations"]["Row"] & {
    sessions?: JoinedSession | null;
  };

function normalizeJoinedClass(
  value: JoinedSession["classes"],
): JoinedClass | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function mapAdminRegistrationRow(
  row: RegistrationJoinRow,
  course: ReturnType<typeof mapCourseRow> | undefined,
  slotEnrollment: number,
): AdminRegistration {
  const joinedSession = row.sessions ?? null;
  const joinedClass = joinedSession ? normalizeJoinedClass(joinedSession.classes) : null;

  const legacySessionDate = course?.sessionDate ?? row.session_date ?? "";
  const legacySessionTime =
    course?.sessionTime ?? row.class_time ?? "—";

  const sessionDate = joinedSession?.date ?? legacySessionDate;
  const sessionTime = joinedSession
    ? formatAdminSessionTimeRange(joinedSession.start_time, joinedSession.end_time)
    : legacySessionTime;
  const className = joinedClass
    ? formatClassLabel(joinedClass.weekday, joinedClass.name)
    : row.class_name ?? "—";

  return {
    id: row.id,
    course_id: row.course_id ?? row.course_slug ?? "",
    order_id: row.order_id ?? null,
    session_id: row.session_id ?? null,
    status: (row.status as AdminRegistration["status"] | undefined) ?? "paid",
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    student_name: row.student_name ?? "",
    student_age: row.student_age ?? "",
    is_first_time: row.is_first_time ?? false,
    note: row.note,
    created_at: row.created_at ?? new Date().toISOString(),
    courseTitle: course?.title ?? "未知課程",
    courseCategory: course?.category ?? "",
    sessionDate,
    sessionDateLabel: formatAdminSessionDate(sessionDate),
    sessionTime,
    className,
    sessionDetailLine: formatAdminSessionDetailLine(sessionDate, sessionTime),
    slotEnrollment,
    maxCapacity: course?.capacity ?? DEFAULT_MAX_CAPACITY,
    orderSessionSlots: [],
  };
}

export function attachOrderSessionSlots(
  registrations: AdminRegistration[],
): AdminRegistration[] {
  const slotsByOrder = new Map<string, AdminSessionSlot[]>();

  for (const registration of registrations) {
    if (!registration.order_id || !registration.session_id) continue;

    const slots = slotsByOrder.get(registration.order_id) ?? [];
    slots.push({
      date: registration.sessionDate,
      dateLabel: registration.sessionDateLabel,
      timeLabel: registration.sessionTime,
      className: registration.className,
      detailLine: registration.sessionDetailLine,
    });
    slotsByOrder.set(registration.order_id, slots);
  }

  for (const [orderId, slots] of slotsByOrder) {
    slotsByOrder.set(
      orderId,
      [...slots].sort((a, b) => a.date.localeCompare(b.date)),
    );
  }

  return registrations.map((registration) => ({
    ...registration,
    orderSessionSlots: registration.order_id
      ? slotsByOrder.get(registration.order_id) ?? []
      : [],
  }));
}

export const ADMIN_REGISTRATIONS_SELECT = `
  *,
  sessions (
    id,
    date,
    start_time,
    end_time,
    classes (
      id,
      name,
      weekday
    )
  )
`;
