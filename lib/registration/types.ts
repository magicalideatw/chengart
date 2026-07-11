import type { RegistrationOrderFormValues } from "@/lib/validation/registration-schema";

export type RegistrationOrderFormData = RegistrationOrderFormValues & {
  unitPrice?: number;
  sessionSummaries?: string[];
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
  const fromArray = normalizeSessionIds(formData.sessionIds);
  if (fromArray.length > 0) return fromArray;

  const legacySingle = (formData as { sessionId?: unknown }).sessionId;
  return normalizeSessionIds(legacySingle);
}

export function usesMultiSessionRegistration(
  formData: RegistrationOrderFormData,
): boolean {
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
