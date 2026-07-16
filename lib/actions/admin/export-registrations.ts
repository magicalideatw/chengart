"use server";

import {
  fetchRegistrationExportSource,
  type RegistrationExportSource,
} from "@/lib/admin/registration-export-data";

export async function getRegistrationExportSource(
  courseId?: string,
): Promise<
  | { success: true; data: RegistrationExportSource }
  | { success: false; error: string }
> {
  return fetchRegistrationExportSource(courseId);
}
