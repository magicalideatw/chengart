import { Resend } from "resend";
import { formatDateTime, formatSessionDate } from "@/lib/admin/format";
import { getEmailConfig } from "@/lib/email/config";
import {
  buildAdminRegistrationEmail,
  buildParentRegistrationEmail,
} from "@/lib/email/templates/registration-notification";
import type { RegistrationEmailData } from "@/lib/email/types";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import type { RegistrationOrderFormData } from "@/lib/registration/types";
import { usesMultiSessionRegistration } from "@/lib/registration/types";

type SendRegistrationNotificationsInput = {
  course: CourseWithEnrollment;
  formData: RegistrationOrderFormData;
  enrollmentCount: number;
};

function buildEmailData(
  input: SendRegistrationNotificationsInput,
): RegistrationEmailData {
  const { course, formData, enrollmentCount } = input;
  const multiSession = usesMultiSessionRegistration(formData);

  return {
    courseTitle: course.title,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    sessionDate: multiSession
      ? formData.sessionSummaries?.join("、") ?? "—"
      : formatSessionDate(course.sessionDate),
    sessionTime: multiSession
      ? `共 ${formData.sessionIds?.length ?? 0} 堂`
      : course.sessionTime || "—",
    enrollmentLabel: `${enrollmentCount}/${course.capacity}`,
    note: formData.note?.trim() || "—",
    registeredAt: formatDateTime(new Date().toISOString()),
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
