import type { ClassSession } from "@/lib/sessions/types";

export function isSessionSelectable(session: ClassSession): boolean {
  return session.status === "open" && session.remainingCapacity > 0;
}
