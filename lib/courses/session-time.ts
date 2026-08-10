/** Parse "14:00–15:00", "14:00-15:00", or "14:00~15:00" into start/end. */
export function parseCourseSessionTimeRange(value: string): {
  startTime: string;
  endTime: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return { startTime: "", endTime: "" };
  }

  const match = trimmed.match(/^(.+?)\s*[–\-~～]\s*(.+)$/);
  if (match) {
    return { startTime: match[1].trim(), endTime: match[2].trim() };
  }

  return { startTime: trimmed, endTime: "" };
}

export function formatCourseSessionTimeRange(
  startTime: string,
  endTime: string,
): string {
  const start = startTime.trim();
  const end = endTime.trim();
  if (start && end) return `${start}–${end}`;
  return start || end;
}
