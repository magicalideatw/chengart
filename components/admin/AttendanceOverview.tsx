import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  formatAdminSessionScheduleLine,
  formatSessionDate,
} from "@/lib/admin/format";
import type { CourseSessionAttendanceItem } from "@/lib/attendance/types";
import type { Course } from "@/lib/courses/types";

type AttendanceOverviewProps = {
  courses: Course[];
  todaySessions: CourseSessionAttendanceItem[];
  todayLabel: string;
};

export function AttendanceOverview({
  courses,
  todaySessions,
  todayLabel,
}: AttendanceOverviewProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          今日上課（{todayLabel}）
        </h2>
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
                {todaySessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      今日無上課堂次
                    </td>
                  </tr>
                ) : (
                  todaySessions.map((session) => (
                    <tr
                      key={session.sessionId}
                      className="transition hover:bg-surface/60"
                    >
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
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          依課程點名
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.length === 0 ? (
            <p className="text-sm text-muted">尚無課程</p>
          ) : (
            courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/attendance/courses/${course.id}`}
                className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition hover:border-gold/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
              >
                <p className="font-display text-base font-semibold text-foreground">
                  {course.title}
                </p>
                <p className="mt-2 text-sm text-muted">查看所有上課日期並點名</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
