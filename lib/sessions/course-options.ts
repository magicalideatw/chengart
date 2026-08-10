import type { ClassSession } from "@/lib/sessions/types";
import { isSessionSelectable } from "@/lib/sessions/session-utils";

function sessionSortKey(session: ClassSession): string {
  if (session.sessionType === "self_scheduled") {
    return `0-${String(session.sortOrder).padStart(6, "0")}`;
  }
  return `1-${session.date}-${session.startTime}`;
}

/** For course detail: one radio option per 班別 name (earliest future open session wins). */
export function getCourseSessionRadioOptions(
  sessions: ClassSession[],
): ClassSession[] {
  const selectable = sessions.filter(isSessionSelectable);
  const byName = new Map<string, ClassSession>();

  for (const session of selectable) {
    const key = session.name.trim() || session.id;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, session);
      continue;
    }

    const sessionKey = sessionSortKey(session);
    const existingKey = sessionSortKey(existing);
    if (sessionKey < existingKey) {
      byName.set(key, session);
    }
  }

  return [...byName.values()].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder || sessionSortKey(a).localeCompare(sessionSortKey(b)),
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
