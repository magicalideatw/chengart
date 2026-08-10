export const SESSION_STATUSES = ["open", "closed", "cancelled", "full"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  open: "開放",
  closed: "已關閉",
  cancelled: "已取消",
  full: "已滿",
};

export const SESSION_TYPES = ["fixed", "self_scheduled"] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  fixed: "固定日期",
  self_scheduled: "自行預約（協調時間）",
};

/** Shared activity session (課程班別 / 演出場次 / 營隊梯次) */
export type ClassSession = {
  id: string;
  courseId: string;
  classId: string | null;
  sessionType: SessionType;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity: number;
  price: number;
  location: string;
  isOpen: boolean;
  sortOrder: number;
  status: SessionStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionFormInput = {
  sessionType: SessionType;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity: number;
  price: number;
  location: string;
  isOpen: boolean;
  sortOrder: number;
  status: SessionStatus;
  notes: string;
};

export type BulkGenerateSessionsInput = {
  weekday: string;
  startDate: string;
  endDate: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  price?: number;
};
