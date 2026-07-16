import type { OrderStudentInput } from "@/lib/registration/types";

export type SessionPriceMap = Map<string, number>;

/** @deprecated session-based pricing replaced by price_per_student */
export function buildSessionPriceMap(
  plan: import("@/lib/registration/queries").CourseRegistrationPlan,
): SessionPriceMap {
  const map = new Map<string, number>();
  for (const item of plan.classes) {
    for (const session of item.sessions) {
      map.set(session.id, item.unitPrice);
    }
  }
  return map;
}

/** @deprecated use calculateOrderTotal with pricePerStudent */
export function calculateStudentSessionTotal(
  sessionIds: string[],
  sessionPriceMap: SessionPriceMap,
  defaultUnitPrice: number,
): number {
  return sessionIds.reduce(
    (sum, sessionId) => sum + (sessionPriceMap.get(sessionId) ?? defaultUnitPrice),
    0,
  );
}

export function getEffectivePricePerStudent(course: {
  pricePerStudent?: number;
  fee?: number;
}): number {
  if (typeof course.pricePerStudent === "number" && course.pricePerStudent >= 0) {
    return course.pricePerStudent;
  }
  return course.fee ?? 0;
}

export function countRegistrationStudents(
  students: Pick<OrderStudentInput, "sessionIds">[] | undefined,
): number {
  return Math.max(students?.length ?? 0, 0);
}

/** Billable session slots: one per student when not session-based, else sum of each student's sessionIds. */
export function countRegistrationSessionSlots(
  students: Pick<OrderStudentInput, "sessionIds">[] | undefined,
  options?: { usesSessions?: boolean },
): number {
  const list = students ?? [];
  if (list.length === 0) return 0;

  if (!options?.usesSessions) {
    return list.length;
  }

  return list.reduce(
    (sum, student) => sum + (student.sessionIds?.length ?? 0),
    0,
  );
}

export function calculateOrderTotal(input: {
  pricePerStudent: number;
  studentCount: number;
}): number {
  const count = Math.max(input.studentCount, 0);
  const unit = Math.max(input.pricePerStudent, 0);
  return unit * count;
}

export function calculateOrderTotalFromStudents(input: {
  pricePerStudent: number;
  students: Pick<OrderStudentInput, "sessionIds">[];
  usesSessions?: boolean;
}): number {
  return calculateOrderTotal({
    pricePerStudent: input.pricePerStudent,
    studentCount: countRegistrationSessionSlots(input.students, {
      usesSessions: input.usesSessions,
    }),
  });
}

export {
  calculateRegistrationPricing,
  courseToPricingRules,
} from "@/lib/pricing/engine";
export type { PricingSnapshot } from "@/lib/pricing/types";
