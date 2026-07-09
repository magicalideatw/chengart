import type { CourseClass, CourseDateOption } from "@/src/data/courses";

export const DANCE_CLASS_CAPACITY = 5;

export const DANCE_CLASS_SCHEDULE = [
  { id: "A", name: "A班", time: "14:00–15:00" },
  { id: "B", name: "B班", time: "15:30–16:30" },
  { id: "C", name: "C班", time: "17:00–18:00" },
  { id: "D", name: "D班", time: "18:30–19:30" },
] as const;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}（六）`;
}

export function getNextSaturdays(
  count: number,
  from: Date = new Date(),
): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  const day = cursor.getDay();
  const daysUntilNext =
    day === 6 ? 7 : day === 0 ? 6 : ((6 - day + 7) % 7) || 7;

  cursor.setDate(cursor.getDate() + daysUntilNext);

  for (let i = 0; i < count; i++) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return dates;
}

function buildClassesForDate(): CourseClass[] {
  return DANCE_CLASS_SCHEDULE.map((item) => ({
    id: item.id,
    name: item.name,
    time: item.time,
    capacity: DANCE_CLASS_CAPACITY,
    full: false,
  }));
}

export function buildDanceDateOptions(
  count = 12,
  from: Date = new Date(),
): CourseDateOption[] {
  return getNextSaturdays(count, from).map((date) => {
    const dateKey = toDateKey(date);

    return {
      date: dateKey,
      dayLabel: formatDayLabel(date),
      schedule: "每週六",
      classes: buildClassesForDate(),
    };
  });
}
