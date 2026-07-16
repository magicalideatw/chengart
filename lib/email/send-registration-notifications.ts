import { notifyParentRegistrationSuccess } from "@/lib/email/dispatch";
import type { CourseWithEnrollment } from "@/lib/courses/types";
import {
  normalizeStudentsFromFormData,
  type RegistrationOrderFormData,
} from "@/lib/registration/types";
import type { ParentFormValues } from "@/lib/validation/registration-schema";

type SendRegistrationNotificationsInput = {
  course: CourseWithEnrollment;
  formData: RegistrationOrderFormData | ParentFormValues;
  enrollmentCount: number;
};

/** @deprecated Legacy direct registration path. Prefer order-based email dispatch. */
export async function sendRegistrationNotifications(
  input: SendRegistrationNotificationsInput,
): Promise<void> {
  const { course, formData } = input;
  const students = normalizeStudentsFromFormData(
    formData as RegistrationOrderFormData,
  );

  const legacyOrder = {
    id: "legacy",
    merchant_trade_no: "LEGACY",
    course_id: course.id,
    course_title: course.title,
    status: "paid" as const,
    order_status: "completed" as const,
    payment_status: "paid" as const,
    amount: 0,
    subtotal: 0,
    discount_total: 0,
    promo_code: null,
    pricing_snapshot: {},
    payment_method: "free" as const,
    ecpay_trade_no: null,
    registration_id: null,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    form_data: {
      ...(formData as RegistrationOrderFormData),
      students,
    },
    paid_at: new Date().toISOString(),
    transfer_reported: false,
    transfer_last5: null,
    transfer_date: null,
    transfer_time: null,
    transfer_note: null,
    transfer_reported_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await notifyParentRegistrationSuccess({
    order: legacyOrder,
    course,
  });
}
