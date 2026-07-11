import type {
  AdminOrderRegistration,
  AdminOrderStudent,
  AdminRegistrationSession,
} from "@/lib/admin/types";
import {
  formatAdminSessionCompactLine,
  formatAdminSessionScheduleLine,
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

type JoinedStudent = {
  id: string;
  student_name: string;
  student_age: string;
  gender: string | null;
  is_first_time: boolean;
  note: string | null;
  sort_order: number;
};

export type RegistrationJoinRow =
  Database["public"]["Tables"]["registrations"]["Row"] & {
    sessions?: JoinedSession | null;
    students?: JoinedStudent | JoinedStudent[] | null;
  };

type MappedRegistrationRow = {
  row: RegistrationJoinRow;
  session: AdminRegistrationSession;
  parent: {
    name: string;
    phone: string;
    email: string;
    course_id: string;
    order_id: string | null;
    status: AdminOrderRegistration["status"];
    created_at: string;
    note: string | null;
  };
};

function normalizeJoinedClass(
  value: JoinedSession["classes"],
): JoinedClass | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeJoinedStudent(
  value: RegistrationJoinRow["students"],
): JoinedStudent | null {
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

  return {
    registrationId: row.id,
    sessionId: null,
    date: legacyDate,
    start_time: start,
    end_time: end,
    className: row.class_name?.trim() || "—",
    scheduleLine: legacyDate
      ? formatAdminSessionScheduleLine(legacyDate, start, end)
      : legacyTime || "—",
    compactLine: legacyDate
      ? formatAdminSessionCompactLine(legacyDate, start, end)
      : legacyTime || "—",
  };
}

function studentKey(row: RegistrationJoinRow): string {
  const joinedStudent = normalizeJoinedStudent(row.students);
  if (joinedStudent?.id) return joinedStudent.id;
  if (row.student_id) return row.student_id;
  return `legacy:${row.student_name}:${row.student_age}`;
}

function buildStudentFromGroup(
  key: string,
  items: MappedRegistrationRow[],
): AdminOrderStudent {
  const first = items[0];
  const joinedStudent = normalizeJoinedStudent(first.row.students);
  const sessions = [...items]
    .sort((a, b) => a.session.date.localeCompare(b.session.date))
    .map((item) => item.session);

  return {
    id: joinedStudent?.id ?? key,
    student_name: joinedStudent?.student_name ?? first.row.student_name,
    student_age: joinedStudent?.student_age ?? first.row.student_age,
    gender: joinedStudent?.gender ?? null,
    is_first_time: joinedStudent?.is_first_time ?? first.row.is_first_time,
    note: joinedStudent?.note ?? first.row.note,
    sessions,
    registrationIds: items.map((item) => item.row.id),
  };
}

function mergeOrderGroup(
  items: MappedRegistrationRow[],
  course: ReturnType<typeof mapCourseRow> | undefined,
  slotEnrollment: number,
): AdminOrderRegistration {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(a.parent.created_at).getTime() -
      new Date(b.parent.created_at).getTime(),
  );
  const base = sorted[0];

  const studentGroups = new Map<string, MappedRegistrationRow[]>();
  for (const item of items) {
    const key = studentKey(item.row);
    const list = studentGroups.get(key) ?? [];
    list.push(item);
    studentGroups.set(key, list);
  }

  const students = [...studentGroups.values()]
    .map((group) => buildStudentFromGroup(studentKey(group[0].row), group))
    .sort((a, b) => a.student_name.localeCompare(b.student_name, "zh-Hant"));

  const registrationIds = items.map((item) => item.row.id);

  return {
    id: base.parent.order_id ?? registrationIds[0],
    order_id: base.parent.order_id,
    registrationIds,
    course_id: base.parent.course_id,
    status: base.parent.status,
    name: base.parent.name,
    phone: base.parent.phone,
    email: base.parent.email,
    parent_note: base.parent.note,
    created_at: base.parent.created_at,
    courseTitle: course?.title ?? "未知課程",
    courseCategory: course?.category ?? "",
    students,
    studentCount: students.length,
    slotEnrollment,
    maxCapacity: course?.capacity ?? DEFAULT_MAX_CAPACITY,
  };
}

export function groupAdminRegistrations(
  rows: RegistrationJoinRow[],
  courseMap: Map<string, ReturnType<typeof mapCourseRow>>,
  slotCounts: Record<string, number>,
): AdminOrderRegistration[] {
  const mapped = rows.map((row) => {
    const lookupKey = row.course_id ?? row.course_slug ?? "";
    const course = courseMap.get(lookupKey);
    const session = buildSessionFromRow(row, course);

    return {
      row,
      session,
      parent: {
        name: row.name ?? "",
        phone: row.phone ?? "",
        email: row.email ?? "",
        course_id: lookupKey,
        order_id: row.order_id ?? null,
        status: (row.status as AdminOrderRegistration["status"]) ?? "paid",
        created_at: row.created_at ?? new Date().toISOString(),
        note: row.note,
      },
    };
  });

  const orderGroups = new Map<string, MappedRegistrationRow[]>();

  for (const item of mapped) {
    const key = item.parent.order_id ?? `single:${item.row.id}`;
    const list = orderGroups.get(key) ?? [];
    list.push(item);
    orderGroups.set(key, list);
  }

  return [...orderGroups.values()]
    .map((items) => {
      const lookupKey = items[0].parent.course_id;
      const course = courseMap.get(lookupKey);
      return mergeOrderGroup(items, course, slotCounts[lookupKey] ?? 0);
    })
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
  ),
  students (
    id,
    student_name,
    student_age,
    gender,
    is_first_time,
    note,
    sort_order
  )
`;

/** Backward-compatible alias */
export type AdminRegistration = AdminOrderRegistration;
