import { formatAdminSessionScheduleLine, formatFee, trimAdminTime } from "@/lib/admin/format";
import { enrichOrderListItem } from "@/lib/admin/order-management";
import {
  getPerformanceTicketLines,
  isPerformanceOrderFormData,
} from "@/lib/orders/order-form-data";
import { getOrderEmailLogs, type OrderEmailLogRecord } from "@/lib/orders/email-logs";
import type { StudentAttendanceStats } from "@/lib/attendance/types";
import {
  getStudentAttendanceRecords,
  getStudentAttendanceStatsMap,
} from "@/lib/attendance/queries";
import { getOrderById } from "@/lib/orders/queries";
import type { OrderRecord } from "@/lib/orders/types";
import { normalizeStudentsFromFormData } from "@/lib/registration/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export type AdminOrderStudentDetail = {
  id: string | null;
  studentName: string;
  studentAge: string;
  gender: string | null;
  isFirstTime: boolean;
  note: string | null;
  sessions: Array<{
    sessionId: string;
    date: string;
    startTime: string;
    endTime: string;
    scheduleLine: string;
  }>;
  attendanceStats: StudentAttendanceStats | null;
  attendanceRecords: Array<{
    date: string;
    scheduleLine: string;
    className: string;
    courseTitle: string;
    status: string;
  }>;
};

export type AdminOrderDetail = {
  order: ReturnType<typeof enrichOrderListItem>;
  students: AdminOrderStudentDetail[];
  emailLogs: OrderEmailLogRecord[];
};

async function fetchSessionMap(sessionIds: string[]) {
  if (!isSupabaseConfigured() || sessionIds.length === 0) {
    return new Map<
      string,
      { date: string; start_time: string; end_time: string }
    >();
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, date, start_time, end_time")
    .in("id", sessionIds);

  if (error) {
    console.error("Failed to fetch sessions for order detail:", error.message);
    return new Map();
  }

  return new Map(
    (data ?? []).map((session) => [
      session.id,
      {
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
      },
    ]),
  );
}

async function fetchDbStudents(orderId: string) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, student_name, student_age, gender, is_first_time, note, sort_order")
    .eq("order_id", orderId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch students for order detail:", error.message);
    return [];
  }

  return data ?? [];
}

function buildStudentDetails(
  order: OrderRecord,
  sessionMap: Map<string, { date: string; start_time: string; end_time: string }>,
  dbStudents: Awaited<ReturnType<typeof fetchDbStudents>>,
  statsMap: Map<string, StudentAttendanceStats>,
  recordsMap: Map<
    string,
    Array<{
      date: string;
      scheduleLine: string;
      className: string;
      courseTitle: string;
      status: string;
    }>
  >,
): AdminOrderStudentDetail[] {
  const formStudents = normalizeStudentsFromFormData(order.form_data);

  return formStudents.map((student, index) => {
    const dbStudent = dbStudents[index] ?? null;
    const sessionIds = student.sessionIds ?? [];

    const sessions = sessionIds.map((sessionId) => {
      const session = sessionMap.get(sessionId);
      const startTime = trimAdminTime(session?.start_time ?? "");
      const endTime = trimAdminTime(session?.end_time ?? "");
      const date = session?.date ?? "—";

      return {
        sessionId,
        date,
        startTime,
        endTime,
        scheduleLine: formatAdminSessionScheduleLine(date, startTime, endTime),
      };
    });

    return {
      id: dbStudent?.id ?? null,
      studentName: student.studentName,
      studentAge: student.studentAge,
      gender: dbStudent?.gender ?? student.gender ?? null,
      isFirstTime: dbStudent?.is_first_time ?? student.isFirstTime === "yes",
      note: dbStudent?.note ?? student.note ?? null,
      sessions,
      attendanceStats: dbStudent?.id ? statsMap.get(dbStudent.id) ?? null : null,
      attendanceRecords: dbStudent?.id
        ? recordsMap.get(dbStudent.id) ?? []
        : [],
    };
  });
}

export async function fetchAdminOrderDetail(
  orderId: string,
): Promise<AdminOrderDetail | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  if (isPerformanceOrderFormData(order.form_data)) {
    const ticketLines = getPerformanceTicketLines(order.form_data);
    const emailLogs = await getOrderEmailLogs(orderId);

    return {
      order: enrichOrderListItem(order),
      students: ticketLines.map((line) => ({
        id: null,
        studentName: `${line.name} ×${line.quantity}`,
        studentAge: formatFee(line.subtotal),
        gender: null,
        isFirstTime: false,
        note: null,
        sessions: [],
        attendanceStats: null,
        attendanceRecords: [],
      })),
      emailLogs,
    };
  }

  const formStudents = normalizeStudentsFromFormData(order.form_data);
  const sessionIds = [
    ...new Set(formStudents.flatMap((student) => student.sessionIds ?? [])),
  ];

  const [sessionMap, dbStudents, emailLogs] = await Promise.all([
    fetchSessionMap(sessionIds),
    fetchDbStudents(orderId),
    getOrderEmailLogs(orderId),
  ]);

  const studentIds = dbStudents.map((student) => String(student.id));
  const statsMap = await getStudentAttendanceStatsMap(studentIds);
  const recordsEntries = await Promise.all(
    studentIds.map(async (studentId) => [
      studentId,
      await getStudentAttendanceRecords(studentId),
    ] as const),
  );
  const recordsMap = new Map(recordsEntries);

  return {
    order: enrichOrderListItem(order),
    students: buildStudentDetails(
      order,
      sessionMap,
      dbStudents,
      statsMap,
      recordsMap,
    ),
    emailLogs,
  };
}
