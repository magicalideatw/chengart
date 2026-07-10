export const WEEKDAYS = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type CourseClass = {
  id: string;
  courseId: string;
  name: string;
  teacher: string;
  weekday: string;
  startTime: string;
  endTime: string;
  capacity: number;
  fee: number | null;
  isOpen: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ClassFormInput = {
  name: string;
  teacher: string;
  weekday: string;
  startTime: string;
  endTime: string;
  capacity: number;
  fee: number | null;
  isOpen: boolean;
  sortOrder: number;
};
