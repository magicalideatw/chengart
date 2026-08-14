const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"] as const;

export const SELF_SCHEDULED_SCHEDULE_TITLE = "📅 上課時間";

export const SELF_SCHEDULED_SCHEDULE_MESSAGE =
  "報名完成後，將由老師與您聯繫，協調每堂上課日期與時間。";

export function isSelfScheduledSession(session: {
  sessionType?: string;
}): boolean {
  return session.sessionType === "self_scheduled";
}

export function formatSessionCheckboxLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekday = WEEKDAY_SHORT[new Date(year, month - 1, day).getDay()];
  return `${month}/${day}（${weekday}）`;
}

/** Performance session card: 2026/08/10（六） */
export function formatPerformanceSessionDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const weekday = WEEKDAY_SHORT[new Date(year, month - 1, day).getDay()];
  return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}（${weekday}）`;
}

/** NT$299 or 免費 — never NT$0 */
export function formatSessionDisplayPrice(price: number): string {
  const value = Number.isFinite(price) ? Math.max(0, price) : 0;
  return value > 0 ? `NT$${value.toLocaleString()}` : "免費";
}

/** Course session card: fixed shows date + time; self-scheduled shows coordination message. */
export function formatCourseSessionScheduleLines(session: {
  sessionType?: string;
  date: string;
  startTime: string;
  endTime: string;
}): { primary: string; secondary: string } {
  if (isSelfScheduledSession(session)) {
    return {
      primary: SELF_SCHEDULED_SCHEDULE_TITLE,
      secondary: SELF_SCHEDULED_SCHEDULE_MESSAGE,
    };
  }

  const dateLabel = formatPerformanceSessionDate(session.date);
  const timeLabel =
    session.startTime && session.endTime
      ? `${session.startTime}–${session.endTime}`
      : session.startTime || session.endTime || "";

  return {
    primary: dateLabel,
    secondary: timeLabel,
  };
}

function formatRegistrationSlotTimeRange(startTime: string, endTime: string): string {
  if (startTime && endTime) return `${startTime}–${endTime}`;
  return startTime || endTime || "";
}

/** Registration page radio label: A班｜14:00–15:00 or A班｜8/29（六）14:00–15:00 */
export function formatRegistrationSlotLabel(session: {
  sessionType?: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
}): string {
  const name = session.name.trim() || "時段";
  const timeRange = formatRegistrationSlotTimeRange(session.startTime, session.endTime);

  if (isSelfScheduledSession(session)) {
    return name;
  }

  if (session.date) {
    const datePart = formatSessionCheckboxLabel(session.date);
    return timeRange ? `${name}｜${datePart} ${timeRange}` : `${name}｜${datePart}`;
  }

  return timeRange ? `${name}｜${timeRange}` : name;
}

export function formatCourseSessionSelectionLabel(session: {
  sessionType?: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
}): string {
  const name = session.name.trim();
  if (isSelfScheduledSession(session)) {
    return name ? `${name} · ${SELF_SCHEDULED_SCHEDULE_TITLE}` : SELF_SCHEDULED_SCHEDULE_TITLE;
  }

  const datePart = `${formatSessionCheckboxLabel(session.date)} ${session.startTime}~${session.endTime}`;
  return name ? `${name} · ${datePart}` : datePart;
}
