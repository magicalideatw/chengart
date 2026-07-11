import { Resend } from "resend";
import { formatDateTime, formatSessionDate } from "@/lib/admin/format";
import { getEmailConfig } from "@/lib/email/config";
import {
  buildAdminRegistrationEmail,
  buildParentRegistrationEmail,
} from "@/lib/email/templates/registration-notification";
import type { RegistrationEmailData } from "@/lib/email/types";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import {
  normalizeStudentsFromFormData,
  usesMultiSessionRegistration,
  type RegistrationOrderFormData,
} from "@/lib/registration/types";
import type { ParentFormValues } from "@/lib/validation/registration-schema";

type SendRegistrationNotificationsInput = {
  course: CourseWithEnrollment;
  formData: RegistrationOrderFormData | ParentFormValues;
  enrollmentCount: number;
};

function buildEmailData(
  input: SendRegistrationNotificationsInput,
): RegistrationEmailData {
  const { course, formData, enrollmentCount } = input;
  const students = normalizeStudentsFromFormData(
    formData as RegistrationOrderFormData,
  );
  const multiSession = usesMultiSessionRegistration(
    formData as RegistrationOrderFormData,
  );

  const sessionSummaries = students.flatMap((student) =>
    (student.sessionIds ?? []).length > 0
      ? [`${student.studentName}：${student.sessionIds?.length ?? 0} 堂`]
      : [],
  );

  const emailStudents = students.map((student) => ({
    name: student.studentName,
    age: student.studentAge,
    sessions:
      (formData as RegistrationOrderFormData).sessionSummaries?.filter(Boolean) ??
      (student.sessionIds ?? []).map((id) => id.slice(0, 8)),
    note: student.note?.trim() || "—",
  }));

  const totalSessions = students.reduce(
    (sum, student) => sum + (student.sessionIds?.length ?? 0),
    0,
  );

  return {
    courseTitle: course.title,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    sessionDate: multiSession
      ? sessionSummaries.join("、") || `共 ${totalSessions} 堂`
      : formatSessionDate(course.sessionDate),
    sessionTime: multiSession
      ? `共 ${students.length} 位學生`
      : course.sessionTime || "—",
    enrollmentLabel: `${enrollmentCount}/${course.capacity}`,
    note:
      ("parentNote" in formData ? formData.parentNote?.trim() : undefined) ||
      ("note" in formData ? formData.note?.trim() : undefined) ||
      "—",
    registeredAt: formatDateTime(new Date().toISOString()),
    studentCount: students.length,
    students: emailStudents,
  };
}

export async function sendRegistrationNotifications(
  input: SendRegistrationNotificationsInput,
): Promise<void> {
  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn("RESEND_FROM_EMAIL 未設定，略過寄信。");
    return;
  }

  const config = getEmailConfig();
  if (!config) {
    console.warn(
      "Registration email skipped: missing RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL",
    );
    return;
  }

  const emailData = buildEmailData(input);
  const adminEmail = buildAdminRegistrationEmail(emailData);
  const parentEmail = buildParentRegistrationEmail(emailData);
  const resend = new Resend(config.apiKey);

  const [adminResult, parentResult] = await Promise.allSettled([
    resend.emails.send({
      from: config.fromEmail,
      to: [config.adminEmail],
      subject: adminEmail.subject,
      html: adminEmail.html,
    }),
    resend.emails.send({
      from: config.fromEmail,
      to: [emailData.email],
      subject: parentEmail.subject,
      html: parentEmail.html,
    }),
  ]);

  if (adminResult.status === "rejected") {
    console.error("Failed to send admin registration email:", adminResult.reason);
  } else if (adminResult.value.error) {
    console.error("Failed to send admin registration email:", adminResult.value.error);
  }

  if (parentResult.status === "rejected") {
    console.error("Failed to send parent registration email:", parentResult.reason);
  } else if (parentResult.value.error) {
    console.error(
      "Failed to send parent registration email:",
      parentResult.value.error,
    );
  }
}
