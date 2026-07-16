import type { PricingSnapshot } from "@/lib/pricing/types";
import type {
  RegistrationOrderFormValues,
  RegistrationStudentInput,
} from "@/lib/validation/registration-schema";
import { isPerformanceOrderFormData } from "@/lib/orders/order-form-data";

export type OrderStudentInput = RegistrationStudentInput;

export type RegistrationOrderFormData = RegistrationOrderFormValues & {
  unitPrice?: number;
  promoCode?: string;
  pricingSnapshot?: PricingSnapshot;
  sessionSummaries?: string[];
  paymentMethod?: import("@/lib/payment/types").PaymentMethod;
  registrationType?: import("@/lib/courses/registration-mode").ActiveRegistrationType;
  /** @deprecated legacy single-student fields */
  studentName?: string;
  studentAge?: string;
  isFirstTime?: "yes" | "no";
};

function normalizeSessionIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map(String).filter(Boolean))];
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

export function getSessionIdsFromFormData(
  formData: RegistrationOrderFormData,
): string[] {
  const fromStudents = (formData.students ?? []).flatMap((student) =>
    normalizeSessionIds(student.sessionIds),
  );
  if (fromStudents.length > 0) {
    return [...new Set(fromStudents)];
  }

  const fromArray = normalizeSessionIds(formData.sessionIds);
  if (fromArray.length > 0) return fromArray;

  const legacySingle = (formData as { sessionId?: unknown }).sessionId;
  return normalizeSessionIds(legacySingle);
}

export function normalizeStudentsFromFormData(
  formData: RegistrationOrderFormData | Record<string, unknown>,
): OrderStudentInput[] {
  if (isPerformanceOrderFormData(formData)) {
    return [];
  }

  const registrationFormData = formData as RegistrationOrderFormData;

  if (registrationFormData.students?.length) {
    return registrationFormData.students.map((student) => ({
      ...student,
      sessionIds: normalizeSessionIds(student.sessionIds),
    }));
  }

  const legacyName = registrationFormData.studentName?.trim();
  const legacyAge = registrationFormData.studentAge?.trim();
  if (!legacyName || !legacyAge) return [];

  return [
    {
      clientId: "legacy",
      studentName: legacyName,
      studentAge: legacyAge,
      isFirstTime: registrationFormData.isFirstTime ?? "no",
      note: registrationFormData.note ?? "",
      sessionIds: getSessionIdsFromFormData(registrationFormData),
    } as OrderStudentInput,
  ];
}

export function usesMultiSessionRegistration(
  formData: RegistrationOrderFormData | Record<string, unknown>,
): boolean {
  if (isPerformanceOrderFormData(formData)) {
    return false;
  }

  const students = normalizeStudentsFromFormData(formData);
  if (students.some((student) => (student.sessionIds?.length ?? 0) > 0)) {
    return true;
  }
  return getSessionIdsFromFormData(formData as RegistrationOrderFormData).length > 0;
}

export function resolveOrderSessionIds(input: {
  formData: RegistrationOrderFormData;
  sessionIds?: string[];
}): string[] {
  return [
    ...new Set([
      ...getSessionIdsFromFormData(input.formData),
      ...normalizeSessionIds(input.sessionIds),
    ]),
  ];
}
