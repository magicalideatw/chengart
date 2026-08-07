import type { ActivityType } from "@/lib/courses/activity-type";
import type { HomeActivityType } from "@/lib/courses/activity-type";

const SESSION_UNIT_LABELS: Record<HomeActivityType, string> = {
  course: "班別",
  performance: "場次",
  camp: "梯次",
  workshop: "場次",
};

export function getSessionUnitLabel(activityType: ActivityType | "camp" | "workshop"): string {
  return SESSION_UNIT_LABELS[activityType] ?? "場次";
}

export function getSessionManagementTitle(
  activityType: ActivityType | "camp" | "workshop",
): string {
  return `${getSessionUnitLabel(activityType)}管理`;
}
