import type { ClassSession } from "@/lib/sessions/types";
import { isSessionSelectable } from "@/lib/sessions/session-utils";

/** For course detail: one radio option per 班別 name (earliest future open session wins). */
export function getCourseSessionRadioOptions(
  sessions: ClassSession[],
): ClassSession[] {
  const selectable = sessions.filter(isSessionSelectable);
  const byName = new Map<string, ClassSession>();

  for (const session of selectable) {
    const key = session.name.trim() || session.id;
    const existing = byName.get(key);
    if (!existing || session.date < existing.date) {
      byName.set(key, session);
    }
  }

  return [...byName.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.date.localeCompare(b.date),
  );
}

/** For performance detail: all open future sessions, newest dates first within sort order. */
export function getPerformanceSessionOptions(
  sessions: ClassSession[],
): ClassSession[] {
  return sessions
    .filter(isSessionSelectable)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.date.localeCompare(b.date) ||
        a.startTime.localeCompare(b.startTime),
    );
}

export function getSessionUnitPrice(
  session: ClassSession,
  courseDefaultFee: number,
): number {
  return session.price > 0 ? session.price : courseDefaultFee;
}
