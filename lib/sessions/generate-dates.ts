import { WEEKDAYS } from "@/lib/classes/types";

const WEEKDAY_INDEX: Record<string, number> = {
  星期日: 0,
  星期一: 1,
  星期二: 2,
  星期三: 3,
  星期四: 4,
  星期五: 5,
  星期六: 6,
};

function parseLocalDate(date: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidWeekday(weekday: string): weekday is (typeof WEEKDAYS)[number] {
  return WEEKDAYS.includes(weekday as (typeof WEEKDAYS)[number]);
}

export function generateWeekdayDates(
  weekday: string,
  startDate: string,
  endDate: string,
): string[] {
  const targetDay = WEEKDAY_INDEX[weekday];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (targetDay === undefined || !start || !end || start > end) {
    return [];
  }

  const current = new Date(start);
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1);
    if (current > end) return [];
  }

  const dates: string[] = [];
  while (current <= end) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 7);
  }

  return dates;
}
