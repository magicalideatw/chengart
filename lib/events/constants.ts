export const EVENT_STATUSES = [
  "招生中",
  "即將開始",
  "演出中",
  "已額滿",
  "已結束",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_TYPES = ["招生", "演出", "活動", "工作坊"] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_COVERS_BUCKET = "event-covers";
