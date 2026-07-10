export const SESSION_STATUSES = ["open", "closed", "cancelled", "full"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  open: "開放",
  closed: "已關閉",
  cancelled: "已取消",
  full: "已滿",
};

export type ClassSession = {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity: number;
  status: SessionStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionFormInput = {
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity: number;
  status: SessionStatus;
  notes: string;
};

export type BulkGenerateSessionsInput = {
  weekday: string;
  startDate: string;
  endDate: string;
};
