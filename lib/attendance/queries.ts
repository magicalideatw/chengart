import {
  computeStudentAttendanceStats,
  computeTodayAttendanceRate,
} from "@/lib/attendance/stats";
import type {
  AttendanceRecord,
  AttendanceStatus,
  CourseSessionAttendanceItem,
  SessionAttendanceContext,
  SessionRosterStudent,
  StudentAttendanceStats,
  TodayAttendanceStats,
} from "@/lib/attendance/types";
import { isAttendanceStatus, parseAttendanceStatus } from "@/lib/attendance/types";
import { trimAdminTime } from "@/lib/admin/format";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

type JoinedSessionRow = {
  id: string;
  class_id: string;
  date: string;
  start_time: string;
  end_time: string;
  classes:
    | {
        id: string;
        name: string;
        course_id: string;
        courses: { id: string; title: string } | { id: string; title: string }[] | null;
      }
    | {
        id: string;
        name: string;
        course_id: string;
        courses: { id: string; title: string } | { id: string; title: string }[] | null;
      }[]
    | null;
};

type RegistrationRosterRow = {
  id: string;
  student_id: string | null;
  student_name: string;
  student_age: string;
  students:
    | {
        id: string;
        student_name: string;
        student_age: string;
      }
    | {
        id: string;
        student_name: string;
        student_age: string;
      }[]
    | null;
};

function mapAttendanceRow(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    studentId: String(row.student_id),
    registrationId: row.registration_id ? String(row.registration_id) : null,
    status: row.status as AttendanceStatus,
    note: row.note ? String(row.note) : null,
    markedAt: String(row.marked_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function normalizeJoined<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function usesAttendanceTable(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createServerClient();
  const { error } = await supabase.from("attendance").select("id").limit(1);

  if (error) {
    if (error.code === "PGRST205") return false;
    console.error("Failed to check attendance table:", error.message);
    return false;
  }

  return true;
}

export async function getSessionAttendanceContext(
  sessionId: string,
): Promise<SessionAttendanceContext | null> {
  if (!isSupabaseConfigured() || !sessionId) return null;

  const supabase = await createServerClient();

  const [sessionResult, rosterResult, attendanceResult] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        `
        id,
        class_id,
        date,
        start_time,
        end_time,
        classes (
          id,
          name,
          course_id,
          courses ( id, title )
        )
      `,
      )
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("registrations")
      .select(
        `
        id,
        student_id,
        student_name,
        student_age,
        students ( id, student_name, student_age )
      `,
      )
      .eq("session_id", sessionId)
      .eq("status", "paid")
      .order("student_name", { ascending: true }),
    supabase.from("attendance").select("*").eq("session_id", sessionId),
  ]);

  if (sessionResult.error || !sessionResult.data) {
    if (sessionResult.error) {
      console.error("Failed to fetch session:", sessionResult.error.message);
    }
    return null;
  }

  const session = sessionResult.data as JoinedSessionRow;
  const courseClass = normalizeJoined(session.classes);
  const course = normalizeJoined(courseClass?.courses ?? null);

  if (!courseClass || !course) return null;

  const attendanceByStudent = new Map<string, AttendanceRecord>();
  for (const row of attendanceResult.data ?? []) {
    const record = mapAttendanceRow(row);
    attendanceByStudent.set(record.studentId, record);
  }

  const roster: SessionRosterStudent[] = (rosterResult.data ?? []).map(
    (row: RegistrationRosterRow) => {
      const student = normalizeJoined(row.students);
      const studentId = student?.id ?? row.student_id;
      const attendance = studentId
        ? attendanceByStudent.get(String(studentId))
        : undefined;

      return {
        registrationId: String(row.id),
        studentId: studentId ? String(studentId) : String(row.id),
        studentName: student?.student_name ?? row.student_name,
        studentAge: student?.student_age ?? row.student_age,
        status: attendance ? parseAttendanceStatus(attendance.status) : "unmarked",
        attendanceId: attendance?.id ?? null,
        note: attendance?.note ?? null,
      };
    },
  );

  const markedCount = roster.filter((student) => student.status !== "unmarked").length;

  return {
    sessionId: String(session.id),
    sessionDate: String(session.date),
    startTime: trimAdminTime(session.start_time),
    endTime: trimAdminTime(session.end_time),
    courseId: String(course.id),
    courseTitle: String(course.title),
    classId: String(courseClass.id),
    className: String(courseClass.name),
    roster,
    markedCount,
    isComplete: roster.length > 0 && markedCount === roster.length,
  };
}

export async function getCourseSessionAttendanceItems(
  courseId: string,
): Promise<CourseSessionAttendanceItem[]> {
  if (!isSupabaseConfigured() || !courseId) return [];

  const supabase = await createServerClient();

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (classesError || !classes?.length) {
    if (classesError) {
      console.error("Failed to fetch classes:", classesError.message);
    }
    return [];
  }

  const classMap = new Map(classes.map((row) => [String(row.id), String(row.name)]));
  const classIds = classes.map((row) => String(row.id));

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, class_id, date, start_time, end_time")
    .in("class_id", classIds)
    .order("date", { ascending: false });

  if (sessionsError || !sessions?.length) {
    if (sessionsError) {
      console.error("Failed to fetch sessions:", sessionsError.message);
    }
    return [];
  }

  const sessionIds = sessions.map((row) => String(row.id));

  const [registrationsResult, attendanceResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("session_id, student_id")
      .in("session_id", sessionIds)
      .eq("status", "paid"),
    supabase
      .from("attendance")
      .select("session_id, student_id")
      .in("session_id", sessionIds),
  ]);

  const rosterCountBySession = new Map<string, number>();
  for (const row of registrationsResult.data ?? []) {
    const sessionId = String(row.session_id);
    rosterCountBySession.set(sessionId, (rosterCountBySession.get(sessionId) ?? 0) + 1);
  }

  const markedCountBySession = new Map<string, number>();
  for (const row of attendanceResult.data ?? []) {
    const sessionId = String(row.session_id);
    markedCountBySession.set(sessionId, (markedCountBySession.get(sessionId) ?? 0) + 1);
  }

  return sessions.map((session) => {
    const sessionId = String(session.id);
    const rosterCount = rosterCountBySession.get(sessionId) ?? 0;
    const markedCount = markedCountBySession.get(sessionId) ?? 0;

    return {
      sessionId,
      classId: String(session.class_id),
      className: classMap.get(String(session.class_id)) ?? "—",
      date: String(session.date),
      startTime: trimAdminTime(session.start_time),
      endTime: trimAdminTime(session.end_time),
      rosterCount,
      markedCount,
      isComplete: rosterCount > 0 && markedCount === rosterCount,
    };
  });
}

export async function getTodaySessionAttendanceItems(
  todayIsoDate: string,
): Promise<CourseSessionAttendanceItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerClient();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      class_id,
      date,
      start_time,
      end_time,
      classes ( id, name, course_id, courses ( id, title ) )
    `,
    )
    .eq("date", todayIsoDate)
    .order("start_time", { ascending: true });

  if (error || !sessions?.length) {
    if (error) console.error("Failed to fetch today sessions:", error.message);
    return [];
  }

  const sessionIds = sessions.map((row) => String(row.id));

  const [registrationsResult, attendanceResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "paid"),
    supabase
      .from("attendance")
      .select("session_id")
      .in("session_id", sessionIds),
  ]);

  const rosterCountBySession = new Map<string, number>();
  for (const row of registrationsResult.data ?? []) {
    const sessionId = String(row.session_id);
    rosterCountBySession.set(sessionId, (rosterCountBySession.get(sessionId) ?? 0) + 1);
  }

  const markedCountBySession = new Map<string, number>();
  for (const row of attendanceResult.data ?? []) {
    const sessionId = String(row.session_id);
    markedCountBySession.set(sessionId, (markedCountBySession.get(sessionId) ?? 0) + 1);
  }

  return sessions.map((session) => {
    const sessionId = String(session.id);
    const courseClass = normalizeJoined(
      (session as JoinedSessionRow).classes ?? null,
    );
    const rosterCount = rosterCountBySession.get(sessionId) ?? 0;
    const markedCount = markedCountBySession.get(sessionId) ?? 0;

    return {
      sessionId,
      classId: courseClass ? String(courseClass.id) : String(session.class_id),
      className: courseClass?.name ?? "—",
      date: String(session.date),
      startTime: trimAdminTime(session.start_time),
      endTime: trimAdminTime(session.end_time),
      rosterCount,
      markedCount,
      isComplete: rosterCount > 0 && markedCount === rosterCount,
    };
  });
}

export async function fetchTodayAttendanceStats(
  todayIsoDate: string,
): Promise<TodayAttendanceStats> {
  const empty: TodayAttendanceStats = {
    sessionsToday: 0,
    studentsToday: 0,
    markedToday: 0,
    unmarkedToday: 0,
    attendanceRateToday: 0,
  };

  if (!isSupabaseConfigured()) return empty;

  const supabase = await createServerClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id")
    .eq("date", todayIsoDate);

  if (sessionsError || !sessions?.length) {
    return { ...empty, sessionsToday: sessions?.length ?? 0 };
  }

  const sessionIds = sessions.map((row) => String(row.id));

  const [registrationsResult, attendanceResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("id")
      .in("session_id", sessionIds)
      .eq("status", "paid"),
    supabase
      .from("attendance")
      .select("status")
      .in("session_id", sessionIds),
  ]);

  const studentsToday = registrationsResult.data?.length ?? 0;
  const markedToday = attendanceResult.data?.length ?? 0;
  const markedRecords = (attendanceResult.data ?? [])
    .map((row) => row.status)
    .filter(isAttendanceStatus)
    .map((status) => ({ status }));

  return {
    sessionsToday: sessions.length,
    studentsToday,
    markedToday,
    unmarkedToday: Math.max(studentsToday - markedToday, 0),
    attendanceRateToday: computeTodayAttendanceRate({ markedRecords }),
  };
}

export async function getStudentAttendanceStatsMap(
  studentIds: string[],
): Promise<Map<string, StudentAttendanceStats>> {
  const result = new Map<string, StudentAttendanceStats>();

  if (!isSupabaseConfigured() || studentIds.length === 0) {
    return result;
  }

  const uniqueStudentIds = [...new Set(studentIds.filter(Boolean))];
  const supabase = await createServerClient();

  const [registrationsResult, attendanceResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("student_id, session_id")
      .in("student_id", uniqueStudentIds)
      .eq("status", "paid")
      .not("session_id", "is", null),
    supabase
      .from("attendance")
      .select("student_id, session_id, status")
      .in("student_id", uniqueStudentIds),
  ]);

  const enrolledByStudent = new Map<string, string[]>();
  for (const row of registrationsResult.data ?? []) {
    if (!row.student_id || !row.session_id) continue;
    const studentId = String(row.student_id);
    const sessions = enrolledByStudent.get(studentId) ?? [];
    sessions.push(String(row.session_id));
    enrolledByStudent.set(studentId, sessions);
  }

  const recordsByStudent = new Map<
    string,
    Array<{ sessionId: string; status: AttendanceStatus }>
  >();

  for (const row of attendanceResult.data ?? []) {
    if (!row.student_id || !row.session_id || !isAttendanceStatus(row.status)) {
      continue;
    }

    const studentId = String(row.student_id);
    const records = recordsByStudent.get(studentId) ?? [];
    records.push({
      sessionId: String(row.session_id),
      status: row.status,
    });
    recordsByStudent.set(studentId, records);
  }

  for (const studentId of uniqueStudentIds) {
    const enrolledSessionIds = enrolledByStudent.get(studentId) ?? [];
    const records = recordsByStudent.get(studentId) ?? [];

    result.set(
      studentId,
      computeStudentAttendanceStats({
        enrolledSessionIds,
        records,
      }),
    );
  }

  return result;
}

export async function getStudentAttendanceRecords(
  studentId: string,
): Promise<
  Array<{
    sessionId: string;
    date: string;
    scheduleLine: string;
    className: string;
    courseTitle: string;
    status: AttendanceStatus;
    markedAt: string;
  }>
> {
  if (!isSupabaseConfigured() || !studentId) return [];

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("attendance")
    .select(
      `
      status,
      marked_at,
      sessions (
        id,
        date,
        start_time,
        end_time,
        classes (
          name,
          courses ( title )
        )
      )
    `,
    )
    .eq("student_id", studentId)
    .order("marked_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch student attendance records:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const session = normalizeJoined(
      row.sessions as
        | {
            id: string;
            date: string;
            start_time: string;
            end_time: string;
            classes:
              | {
                  name: string;
                  courses: { title: string } | { title: string }[] | null;
                }
              | {
                  name: string;
                  courses: { title: string } | { title: string }[] | null;
                }[]
              | null;
          }
        | {
            id: string;
            date: string;
            start_time: string;
            end_time: string;
            classes:
              | {
                  name: string;
                  courses: { title: string } | { title: string }[] | null;
                }
              | {
                  name: string;
                  courses: { title: string } | { title: string }[] | null;
                }[]
              | null;
          }[]
        | null,
    );

    if (!session || !isAttendanceStatus(row.status)) return [];

    const courseClass = normalizeJoined(session.classes);
    const course = normalizeJoined(courseClass?.courses ?? null);
    const startTime = trimAdminTime(session.start_time);
    const endTime = trimAdminTime(session.end_time);

    return [
      {
        sessionId: String(session.id),
        date: String(session.date),
        scheduleLine: `${session.date} ${startTime}~${endTime}`,
        className: courseClass?.name ?? "—",
        courseTitle: course?.title ?? "—",
        status: row.status,
        markedAt: String(row.marked_at),
      },
    ];
  });
}

const TAIPEI_TZ = "Asia/Taipei";

function getTaipeiDateParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIPEI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function getTaipeiTodayIsoDate(date = new Date()): string {
  const { year, month, day } = getTaipeiDateParts(date);
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}
