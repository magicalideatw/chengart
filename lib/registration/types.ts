import type {
  RegistrationOrderFormValues,
  RegistrationStudentInput,
} from "@/lib/validation/registration-schema";

export type OrderStudentInput = RegistrationStudentInput;

export type RegistrationOrderFormData = RegistrationOrderFormValues & {
  unitPrice?: number;
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
  formData: RegistrationOrderFormData,
): OrderStudentInput[] {
  if (formData.students?.length) {
    return formData.students.map((student) => ({
      ...student,
      sessionIds: normalizeSessionIds(student.sessionIds),
    }));
  }

  const legacyName = formData.studentName?.trim();
  const legacyAge = formData.studentAge?.trim();
  if (!legacyName || !legacyAge) return [];

  return [
    {
      clientId: "legacy",
      studentName: legacyName,
      studentAge: legacyAge,
      gender: "",
      isFirstTime: formData.isFirstTime ?? "yes",
      note: formData.note ?? "",
      sessionIds: getSessionIdsFromFormData(formData),
    },
  ];
}

export function usesMultiSessionRegistration(
  formData: RegistrationOrderFormData,
): boolean {
  const students = normalizeStudentsFromFormData(formData);
  if (students.some((student) => (student.sessionIds?.length ?? 0) > 0)) {
    return true;
  }
  return getSessionIdsFromFormData(formData).length > 0;
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
