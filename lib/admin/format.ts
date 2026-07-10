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

export function formatAdminSessionTimeRange(
  startTime?: string | null,
  endTime?: string | null,
): string {
  const start = startTime?.trim();
  const end = endTime?.trim();

  if (start && end) return `${start}~${end}`;
  return start || end || "—";
}

export function formatAdminSessionDetailLine(
  date?: string | null,
  time?: string | null,
): string {
  if (!date || date === "—") return "—";

  const weekday = formatAdminSessionWeekday(date);
  const dateLabel = formatAdminSessionDate(date);
  const timeLabel = time?.trim() || "—";

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
