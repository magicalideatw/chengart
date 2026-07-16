import type { ActivityType } from "@/lib/courses/activity-type";

export const PARTICIPATION_METHODS = ["internal", "external", "coming_soon"] as const;

export type ParticipationMethod = (typeof PARTICIPATION_METHODS)[number];

export const PARTICIPATION_METHOD_LABELS: Record<ParticipationMethod, string> = {
  internal: "本站",
  external: "外部網站",
  coming_soon: "尚未開放",
};

export const COMING_SOON_BUTTON_TEXT = "尚未開放";

export function parseParticipationMethod(value: unknown): ParticipationMethod {
  if (value === "external" || value === "coming_soon") {
    return value;
  }
  return "internal";
}

export function getDefaultActionButtonText(activityType: ActivityType): string {
  return activityType === "performance" ? "立即購票" : "立即報名";
}

export function resolveActionButtonText(
  actionButtonText: string | null | undefined,
  activityType: ActivityType,
): string {
  const trimmed = actionButtonText?.trim();
  return trimmed || getDefaultActionButtonText(activityType);
}

export function isInternalParticipation(method: ParticipationMethod): boolean {
  return method === "internal";
}
