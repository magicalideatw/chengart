import {
  getCourseSessionRadioOptions,
  getSessionUnitPrice,
} from "@/lib/sessions/course-options";
import type { ClassSession } from "@/lib/sessions/types";
import type { CoursePlan } from "@/lib/course-plans/types";

export type CourseRegistrationPlanShape = {
  usesSessions: boolean;
  usesCoursePlans: boolean;
  /** Fixed or multi-slot courses: show the 報名時段 picker on the registration page */
  showRegistrationSlots: boolean;
  sessions: ClassSession[];
  /** Selectable slots for the 報名時段 picker (fixed sessions, or recurring slots when not course-plan) */
  registrationSlotOptions: ClassSession[];
  /** @deprecated use registrationSlotOptions */
  courseSessionOptions: ClassSession[];
  coursePlans: CoursePlan[];
  primarySelfScheduledSessionId: string | null;
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
