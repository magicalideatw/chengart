import type { AdminRegistration, AdminRegistrationSession } from "@/lib/admin/types";
import {
  formatAdminSessionCompactLine,
  formatAdminSessionDate,
  formatAdminSessionScheduleLine,
  formatAdminSessionTimeHyphen,
  formatClassLabel,
  parseAdminTimeRange,
  trimAdminTime,
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

type MappedRegistrationRow = {
  row: RegistrationJoinRow;
  registration: Omit<
    AdminRegistration,
    "sessions" | "sessionScheduleText" | "registrationIds"
  >;
  session: AdminRegistrationSession;
};

function normalizeJoinedClass(
  value: JoinedSession["classes"],
): JoinedClass | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function buildSessionFromRow(
  row: RegistrationJoinRow,
  course: ReturnType<typeof mapCourseRow> | undefined,
): AdminRegistrationSession {
  const joinedSession = row.sessions ?? null;
  const joinedClass = joinedSession
    ? normalizeJoinedClass(joinedSession.classes)
    : null;

  if (joinedSession) {
    const startTime = trimAdminTime(joinedSession.start_time);
    const endTime = trimAdminTime(joinedSession.end_time);
    const className = formatClassLabel(joinedClass?.weekday, joinedClass?.name);

    return {
      registrationId: row.id,
      sessionId: row.session_id ?? null,
      date: joinedSession.date,
      start_time: startTime,
      end_time: endTime,
      className,
      scheduleLine: formatAdminSessionScheduleLine(
        joinedSession.date,
        startTime,
        endTime,
      ),
      compactLine: formatAdminSessionCompactLine(
        joinedSession.date,
        startTime,
        endTime,
      ),
    };
  }

  const legacyDate = course?.sessionDate ?? row.session_date ?? "";
  const legacyTime = course?.sessionTime ?? row.class_time ?? "";
  const { start, end } = parseAdminTimeRange(legacyTime);
  const className = row.class_name?.trim() || "—";

  return {
    registrationId: row.id,
    sessionId: null,
    date: legacyDate,
    start_time: start,
    end_time: end,
    className,
    scheduleLine: legacyDate
      ? formatAdminSessionScheduleLine(legacyDate, start, end)
      : legacyTime && legacyTime !== "—"
        ? legacyTime
        : "—",
    compactLine: legacyDate
      ? formatAdminSessionCompactLine(legacyDate, start, end)
      : legacyTime && legacyTime !== "—"
        ? legacyTime
        : "—",
  };
}

function mapRegistrationBase(
  row: RegistrationJoinRow,
  course: ReturnType<typeof mapCourseRow> | undefined,
  slotEnrollment: number,
): Omit<
  AdminRegistration,
  "sessions" | "sessionScheduleText" | "registrationIds"
> {
  const session = buildSessionFromRow(row, course);

  return {
    id: row.id,
    course_id: row.course_id ?? row.course_slug ?? "",
    order_id: row.order_id ?? null,
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
    sessionDate: session.date,
    sessionDateLabel: formatAdminSessionDate(session.date),
    sessionTime: formatAdminSessionTimeHyphen(session.start_time, session.end_time),
    className: session.className,
    slotEnrollment,
    maxCapacity: course?.capacity ?? DEFAULT_MAX_CAPACITY,
  };
}

function uniqueClassNames(sessions: AdminRegistrationSession[]): string {
  const names = [...new Set(sessions.map((session) => session.className).filter(Boolean))];
  if (names.length === 0) return "—";
  return names.join("、");
}

function mergeRegistrationGroup(items: MappedRegistrationRow[]): AdminRegistration {
  const sorted = [...items].sort((a, b) => {
    const dateCompare = a.session.date.localeCompare(b.session.date);
    if (dateCompare !== 0) return dateCompare;

    return a.session.start_time.localeCompare(b.session.start_time);
  });

  const base = sorted.reduce((earliest, current) =>
    new Date(current.registration.created_at).getTime() <
    new Date(earliest.registration.created_at).getTime()
      ? current
      : earliest,
  ).registration;

  const sessions = sorted.map((item) => item.session);
  const registrationIds = sorted.map((item) => item.registration.id);
  const firstSession = sessions[0];

  return {
    ...base,
    id: registrationIds[0],
    registrationIds,
    sessions,
    sessionScheduleText: sessions.map((session) => session.scheduleLine).join("\n"),
    sessionDate: firstSession?.date ?? "",
    sessionDateLabel: formatAdminSessionDate(firstSession?.date),
    sessionTime:
      sessions.length === 1
        ? formatAdminSessionTimeHyphen(firstSession.start_time, firstSession.end_time)
        : `${sessions.length} 個時段`,
    className: uniqueClassNames(sessions),
  };
}

export function groupAdminRegistrations(
  rows: RegistrationJoinRow[],
  courseMap: Map<string, ReturnType<typeof mapCourseRow>>,
  slotCounts: Record<string, number>,
): AdminRegistration[] {
  const mapped = rows.map((row) => {
    const lookupKey = row.course_id ?? row.course_slug ?? "";
    const course = courseMap.get(lookupKey);
    const registration = mapRegistrationBase(
      row,
      course,
      slotCounts[lookupKey] ?? 0,
    );
    const session = buildSessionFromRow(row, course);

    return { row, registration, session };
  });

  const groups = new Map<string, MappedRegistrationRow[]>();

  for (const item of mapped) {
    const key = item.registration.order_id ?? `single:${item.registration.id}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return [...groups.values()]
    .map((items) => mergeRegistrationGroup(items))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
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
