export function formatSessionDate(date?: string | null): string {
  if (!date) return "—";

  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekday = weekdays[new Date(year, month - 1, day).getDay()];

  return `${month}/${day}（${weekday}）`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

export function formatCourseLabel(title?: string, category?: string): string {
  const safeTitle = title?.trim() || "未知課程";
  const safeCategory = category?.trim();

  return safeCategory ? `${safeTitle} · ${safeCategory}` : safeTitle;
}

export function formatFee(fee?: number | null): string {
  const value = typeof fee === "number" && Number.isFinite(fee) ? fee : 0;
  return `NT$ ${value.toLocaleString()}`;
}

export function formatAdminSessionDate(date?: string | null): string {
  if (!date) return "—";

  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

export function formatAdminSessionWeekday(date?: string | null): string {
  if (!date) return "";

  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "";

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return weekdays[new Date(year, month - 1, day).getDay()];
}

export function trimAdminTime(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed;
}

export function parseAdminTimeRange(value?: string | null): {
  start: string;
  end: string;
} {
  const trimmed = value?.trim() ?? "";
  const match = trimmed.match(/^(\d{1,2}:\d{2})\s*[~\-–]\s*(\d{1,2}:\d{2})/);

  if (match) {
    return {
      start: trimAdminTime(match[1]),
      end: trimAdminTime(match[2]),
    };
  }

  return {
    start: trimAdminTime(trimmed),
    end: "",
  };
}

export function formatAdminSessionTimeHyphen(
  startTime?: string | null,
  endTime?: string | null,
): string {
  const start = trimAdminTime(startTime);
  const end = trimAdminTime(endTime);

  if (start && end) return `${start}-${end}`;
  return start || end || "—";
}

export function formatAdminSessionTimeRange(
  startTime?: string | null,
  endTime?: string | null,
): string {
  const start = trimAdminTime(startTime);
  const end = trimAdminTime(endTime);

  if (start && end) return `${start}~${end}`;
  return start || end || "—";
}

export function formatAdminSessionScheduleLine(
  date?: string | null,
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (!date || date === "—") return "—";

  const weekday = formatAdminSessionWeekday(date);
  const dateLabel = formatAdminSessionDate(date);
  const timeLabel = formatAdminSessionTimeHyphen(startTime, endTime);

  return weekday
    ? `${dateLabel}（${weekday}）${timeLabel}`
    : `${dateLabel} ${timeLabel}`;
}

export function formatAdminSessionCompactLine(
  date?: string | null,
  startTime?: string | null,
  endTime?: string | null,
): string {
  const datePart = formatSessionDate(date);
  const timePart = formatAdminSessionTimeHyphen(startTime, endTime);

  if (!date || date === "—") return "—";
  if (timePart && timePart !== "—") return `${datePart} ${timePart}`;
  return datePart;
}

export function formatAdminSessionDetailLine(
  date?: string | null,
  time?: string | null,
): string {
  if (!date || date === "—") return "—";

  const weekday = formatAdminSessionWeekday(date);
  const dateLabel = formatAdminSessionDate(date);
  const timeLabel = time?.trim().replace(/~/g, "-") || "—";

  return weekday
    ? `${dateLabel}（${weekday}）${timeLabel}`
    : `${dateLabel} ${timeLabel}`;
}

export function formatClassLabel(weekday?: string | null, name?: string | null): string {
  const safeName = name?.trim();
  if (!safeName) return "—";

  const safeWeekday = weekday?.trim();
  if (!safeWeekday) return safeName;
  if (safeName.startsWith(safeWeekday)) return safeName;

  return `${safeWeekday}${safeName}`;
}

/** e.g. 7/14（二） — for admin registration list grouped by student */
export function formatAdminRegistrationSessionDateLine(
  date?: string | null,
): string {
  if (!date || date === "—") return "—";
  return formatSessionDate(date);
}

/** e.g. 7/14（二）14:00–15:00 */
export function formatAdminRegistrationSessionLine(
  date?: string | null,
  startTime?: string | null,
  endTime?: string | null,
): string {
  if (!date || date === "—") return "—";

  const datePart = formatSessionDate(date);
  const start = trimAdminTime(startTime);
  const end = trimAdminTime(endTime);

  if (start && end) return `${datePart}${start}–${end}`;
  if (start) return `${datePart}${start}`;
  return datePart;
}

type RegistrationSessionLineInput = {
  date: string;
  start_time: string;
  end_time: string;
  sessionId?: string | null;
};

export type RegistrationSessionGroup = {
  studentId: string;
  studentName: string;
  lines: string[];
};

function collectStudentSessionLines(
  sessions: RegistrationSessionLineInput[] | undefined,
): string[] {
  const seen = new Set<string>();
  const entries: { sortKey: string; line: string }[] = [];

  for (const session of sessions ?? []) {
    const dedupeKey =
      session.sessionId ??
      `${session.date}|${session.start_time}|${session.end_time}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const line = formatAdminRegistrationSessionDateLine(session.date);
    if (line === "—") continue;

    entries.push({
      sortKey: `${session.date}T${session.start_time ?? ""}`,
      line,
    });
  }

  return entries
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((entry) => entry.line);
}

/** Session dates grouped by student, sorted earliest first within each student. */
export function collectRegistrationSessionGroups(
  students: Array<{
    id: string;
    student_name: string;
    sessions?: RegistrationSessionLineInput[];
  }>,
): RegistrationSessionGroup[] {
  return students.map((student) => ({
    studentId: student.id,
    studentName: student.student_name.trim() || "—",
    lines: collectStudentSessionLines(student.sessions),
  }));
}
