export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "excused",
  "late",
  "early_leave",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceMarkStatus = AttendanceStatus | "unmarked";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceMarkStatus, string> = {
  unmarked: "未點名",
  present: "出席",
  absent: "缺席",
  excused: "請假",
  late: "遲到",
  early_leave: "早退",
};

export const ATTENDANCE_STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: "✔ 出席",
  absent: "✖ 缺席",
  excused: "△ 請假",
  late: "⏰ 遲到",
  early_leave: "↩ 早退",
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  registrationId: string | null;
  status: AttendanceStatus;
  note: string | null;
  markedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionRosterStudent = {
  registrationId: string;
  studentId: string;
  studentName: string;
  studentAge: string;
  status: AttendanceMarkStatus;
  attendanceId: string | null;
  note: string | null;
};

export type SessionAttendanceContext = {
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  courseId: string;
  courseTitle: string;
  classId: string;
  className: string;
  roster: SessionRosterStudent[];
  markedCount: number;
  isComplete: boolean;
};

export type StudentAttendanceStats = {
  totalSessions: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  earlyLeave: number;
  unmarked: number;
  attendanceRate: number;
};

export type CourseSessionAttendanceItem = {
  sessionId: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  rosterCount: number;
  markedCount: number;
  isComplete: boolean;
};

export type TodayAttendanceStats = {
  sessionsToday: number;
  studentsToday: number;
  markedToday: number;
  unmarkedToday: number;
  attendanceRateToday: number;
};

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    typeof value === "string" &&
    ATTENDANCE_STATUSES.includes(value as AttendanceStatus)
  );
}

export function parseAttendanceStatus(value: unknown): AttendanceMarkStatus {
  if (isAttendanceStatus(value)) return value;
  return "unmarked";
}

export function getAttendanceStatusLabel(
  status: AttendanceMarkStatus | string | null | undefined,
): string {
  if (!status) return ATTENDANCE_STATUS_LABELS.unmarked;
  if (status in ATTENDANCE_STATUS_LABELS) {
    return ATTENDANCE_STATUS_LABELS[status as AttendanceMarkStatus];
  }
  return status;
}
