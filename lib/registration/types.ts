import type { RegistrationFormValues } from "@/lib/validation/registration-schema";

export type RegistrationOrderFormData = RegistrationFormValues & {
  sessionIds?: string[];
  unitPrice?: number;
  sessionSummaries?: string[];
};

export function getSessionIdsFromFormData(
  formData: RegistrationOrderFormData,
): string[] {
  return formData.sessionIds ?? [];
}

export function usesMultiSessionRegistration(
  formData: RegistrationOrderFormData,
): boolean {
  return getSessionIdsFromFormData(formData).length > 0;
}
