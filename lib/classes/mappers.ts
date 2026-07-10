import type { Database } from "@/lib/supabase/database.types";
import type { ClassFormInput, CourseClass } from "@/lib/classes/types";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];

export function mapClassRow(row: Record<string, unknown>): CourseClass {
  const item = row as ClassRow;

  return {
    id: String(item.id),
    courseId: String(item.course_id),
    name: String(item.name),
    teacher: String(item.teacher ?? ""),
    weekday: String(item.weekday),
    startTime: String(item.start_time),
    endTime: String(item.end_time),
    capacity: Number(item.capacity ?? 5),
    fee: item.fee === null || item.fee === undefined ? null : Number(item.fee),
    isOpen: Boolean(item.is_open),
    sortOrder: Number(item.sort_order ?? 0),
    createdAt: String(item.created_at),
    updatedAt: String(item.updated_at),
  };
}

export function mapClassToDb(
  courseId: string,
  input: ClassFormInput,
): Database["public"]["Tables"]["classes"]["Insert"] {
  return {
    course_id: courseId,
    name: input.name.trim(),
    teacher: input.teacher.trim(),
    weekday: input.weekday,
    start_time: input.startTime.trim(),
    end_time: input.endTime.trim(),
    capacity: input.capacity,
    fee: input.fee,
    is_open: input.isOpen,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export function classRecordToFormInput(item: CourseClass): ClassFormInput {
  return {
    name: item.name,
    teacher: item.teacher,
    weekday: item.weekday,
    startTime: item.startTime,
    endTime: item.endTime,
    capacity: item.capacity,
    fee: item.fee,
    isOpen: item.isOpen,
    sortOrder: item.sortOrder,
  };
}

export function formatClassSchedule(item: CourseClass): string {
  return `${item.weekday} ${item.startTime}–${item.endTime}`;
}

export function formatWeekdayLabel(weekday: string): string {
  if (weekday.startsWith("星期")) {
    return `每${weekday.replace("星期", "週")}`;
  }
  return weekday;
}

export function formatClassTimeRange(item: CourseClass): string {
  return `${item.startTime}~${item.endTime}`;
}

export function toTimeInputValue(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}
