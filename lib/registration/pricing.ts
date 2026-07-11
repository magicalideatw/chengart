import type { CourseRegistrationPlan } from "@/lib/registration/queries";
import type { OrderStudentInput } from "@/lib/registration/types";

export type SessionPriceMap = Map<string, number>;

export function buildSessionPriceMap(
  plan: CourseRegistrationPlan,
): SessionPriceMap {
  const map = new Map<string, number>();
  for (const item of plan.classes) {
    for (const session of item.sessions) {
      map.set(session.id, item.unitPrice);
    }
  }
  return map;
}

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

export function calculateOrderTotal(input: {
  usesSessions: boolean;
  courseFee: number;
  students: Pick<OrderStudentInput, "sessionIds">[];
  sessionPriceMap: SessionPriceMap;
  defaultUnitPrice: number;
}): number {
  const { usesSessions, courseFee, students, sessionPriceMap, defaultUnitPrice } =
    input;

  if (students.length === 0) return 0;

  if (usesSessions) {
    return students.reduce(
      (total, student) =>
        total +
        calculateStudentSessionTotal(
          student.sessionIds ?? [],
          sessionPriceMap,
          defaultUnitPrice,
        ),
      0,
    );
  }

  return courseFee * students.length;
}
