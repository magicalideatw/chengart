import type {
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceStats,
} from "@/lib/attendance/types";

const ATTENDED_STATUSES: AttendanceStatus[] = [
  "present",
  "late",
  "early_leave",
];

export function computeStudentAttendanceStats(input: {
  enrolledSessionIds: string[];
  records: Pick<AttendanceRecord, "sessionId" | "status">[];
}): StudentAttendanceStats {
  const enrolledSet = new Set(input.enrolledSessionIds);
  const relevantRecords = input.records.filter((record) =>
    enrolledSet.has(record.sessionId),
  );

  const counts = {
    present: 0,
    absent: 0,
    excused: 0,
    late: 0,
    earlyLeave: 0,
  };

  for (const record of relevantRecords) {
    switch (record.status) {
      case "present":
        counts.present += 1;
        break;
      case "absent":
        counts.absent += 1;
        break;
      case "excused":
        counts.excused += 1;
        break;
      case "late":
        counts.late += 1;
        break;
      case "early_leave":
        counts.earlyLeave += 1;
        break;
    }
  }

  const totalSessions = input.enrolledSessionIds.length;
  const marked = relevantRecords.length;
  const unmarked = Math.max(totalSessions - marked, 0);
  const attended = relevantRecords.filter((record) =>
    ATTENDED_STATUSES.includes(record.status),
  ).length;

  const attendanceRate =
    totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

  return {
    totalSessions,
    present: counts.present,
    absent: counts.absent,
    excused: counts.excused,
    late: counts.late,
    earlyLeave: counts.earlyLeave,
    unmarked,
    attendanceRate,
  };
}

export function computeTodayAttendanceRate(input: {
  markedRecords: Array<{ status: AttendanceStatus }>;
}): number {
  if (input.markedRecords.length === 0) return 0;

  const attended = input.markedRecords.filter((record) =>
    ATTENDED_STATUSES.includes(record.status),
  ).length;

  return Math.round((attended / input.markedRecords.length) * 100);
}
