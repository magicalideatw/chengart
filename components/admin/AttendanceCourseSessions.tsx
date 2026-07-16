import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  formatAdminSessionScheduleLine,
  formatSessionDate,
} from "@/lib/admin/format";
import type { CourseSessionAttendanceItem } from "@/lib/attendance/types";

type AttendanceCourseSessionsProps = {
  courseId: string;
  courseTitle: string;
  sessions: CourseSessionAttendanceItem[];
};

export function AttendanceCourseSessions({
  courseTitle,
  sessions,
}: AttendanceCourseSessionsProps) {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/attendance"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          返回出席管理
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">
          {courseTitle}
        </h1>
        <p className="mt-1 text-sm text-muted">選擇上課日期進行點名</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {["日期", "班別", "時間", "學生數", "點名進度", "操作"].map(
                  (label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-4 py-4 font-medium text-muted first:pl-6 last:pr-6"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted">
                    此課程尚無上課日期
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.sessionId} className="transition hover:bg-surface/60">
                    <td className="whitespace-nowrap px-4 py-4 pl-6 font-medium text-foreground">
                      {formatSessionDate(session.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-foreground">
                      {session.className}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-muted">
                      {formatAdminSessionScheduleLine(
                        session.date,
                        session.startTime,
                        session.endTime,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-foreground">
                      {session.rosterCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {session.isComplete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          已完成
                        </span>
                      ) : (
                        <span className="text-foreground">
                          {session.markedCount}/{session.rosterCount}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 pr-6">
                      <Link
                        href={`/admin/attendance/sessions/${session.sessionId}`}
                        className="inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold hover:text-gold"
                      >
                        點名
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
