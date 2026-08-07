import type { ClassSession } from "@/lib/sessions/types";

export function isSessionSelectable(session: ClassSession): boolean {
  return session.isOpen && session.status === "open" && session.remainingCapacity > 0;
}
