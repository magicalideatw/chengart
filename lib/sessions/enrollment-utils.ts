import type { SessionStatus } from "@/lib/sessions/types";
import { SESSION_STATUSES } from "@/lib/sessions/types";

export function computeRemainingCapacity(
  capacity: number,
  enrolledCount: number,
): number {
  const cap = Number.isFinite(capacity) ? capacity : 0;
  const enrolled = Number.isFinite(enrolledCount) ? enrolledCount : 0;
  return Math.max(0, cap - enrolled);
}

export function resolveSessionStatusFromEnrollment(
  storedStatus: string,
  capacity: number,
  enrolledCount: number,
): SessionStatus {
  if (
    typeof storedStatus === "string" &&
    (storedStatus === "cancelled" || storedStatus === "closed")
  ) {
    return storedStatus;
  }

  if (enrolledCount >= capacity) {
    return "full";
  }

  if (
    typeof storedStatus === "string" &&
    SESSION_STATUSES.includes(storedStatus as SessionStatus)
  ) {
    return storedStatus as SessionStatus;
  }

  return "open";
}
