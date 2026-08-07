import {
  getCourseSessionRadioOptions,
  getSessionUnitPrice,
} from "@/lib/sessions/course-options";
import type { ClassSession } from "@/lib/sessions/types";

export type CourseRegistrationPlanShape = {
  usesSessions: boolean;
  sessions: ClassSession[];
  courseSessionOptions: ClassSession[];
  defaultUnitPrice: number;
  hasSelectableSessions: boolean;
};

/** @deprecated Use CourseRegistrationPlan.sessions directly */
export type ClassWithSessionsOption = {
  class: { id: string; name: string };
  sessions: ClassSession[];
  unitPrice: number;
};

/** Backward-compatible adapter for components not yet migrated */
export function planToLegacyClassOptions(
  plan: CourseRegistrationPlanShape,
): ClassWithSessionsOption[] {
  const groups = new Map<string, ClassWithSessionsOption>();

  for (const session of plan.sessions) {
    const key = session.name.trim() || session.id;
    const existing = groups.get(key);
    if (existing) {
      existing.sessions.push(session);
      continue;
    }

    groups.set(key, {
      class: { id: session.classId ?? session.id, name: session.name || key },
      sessions: [session],
      unitPrice: getSessionUnitPrice(session, plan.defaultUnitPrice),
    });
  }

  return [...groups.values()];
}

export { getCourseSessionRadioOptions, getSessionUnitPrice };
