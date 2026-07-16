import type { StudentAttendanceStats } from "@/lib/attendance/types";
import { getAttendanceStatusLabel } from "@/lib/attendance/types";

type StudentAttendanceSummaryProps = {
  stats: StudentAttendanceStats | null | undefined;
  records?: Array<{
    date: string;
    scheduleLine: string;
    className: string;
    courseTitle: string;
    status: string;
  }>;
  compact?: boolean;
};

export function StudentAttendanceSummary({
  stats,
  records = [],
  compact = false,
}: StudentAttendanceSummaryProps) {
  if (!stats || stats.totalSessions === 0) {
    return (
      <p className="text-sm text-muted">
        {compact ? "尚無可統計的出席紀錄" : "尚無已報名的上課時段，無法統計出席"}
      </p>
    );
  }

  const items = [
    { label: "總堂數", value: stats.totalSessions },
    { label: "出席", value: stats.present },
    { label: "缺席", value: stats.absent },
    { label: "請假", value: stats.excused },
    { label: "遲到", value: stats.late },
    { label: "早退", value: stats.earlyLeave },
    { label: "未點名", value: stats.unmarked },
    { label: "出席率", value: `${stats.attendanceRate}%` },
  ];

  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"}`}>
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border/70 bg-surface/40 px-3 py-2"
          >
            <p className="text-[11px] text-muted">{item.label}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {!compact && records.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-foreground">出席紀錄</p>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {records.slice(0, 8).map((record) => (
              <li key={`${record.scheduleLine}-${record.status}`}>
                {record.scheduleLine}
                {record.className !== "—" ? ` · ${record.className}` : ""}
                {" · "}
                <span className="text-muted">
                  {getAttendanceStatusLabel(record.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
