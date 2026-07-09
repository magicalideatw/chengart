import { revalidatePath } from "next/cache";
import { formatEcpayPaymentMethod } from "@/lib/ecpay/payment-method";
import { getCourseWithEnrollment, getEnrollmentCount } from "@/lib/courses/queries";
import { sendRegistrationNotifications } from "@/lib/email/send-registration-notifications";
import {
  getOrderByMerchantTradeNo,
  updateOrderStatus,
} from "@/lib/orders/queries";
import { createPaymentClient } from "@/lib/supabase";
import type { RegistrationFormValues } from "@/lib/validation/registration-schema";

export type FulfillOrderResult =
  | { success: true; alreadyPaid: boolean }
  | { success: false; error: string };

async function insertPaidRegistration(
  orderId: string,
  courseId: string,
  formData: RegistrationFormValues,
  courseTitle: string,
  sessionDate: string,
  sessionTime: string,
): Promise<{ id: string | null; error?: string }> {
  const supabase = await createPaymentClient();

  const newPayload = {
    course_id: courseId,
    order_id: orderId,
    status: "paid" as const,
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    student_name: formData.studentName,
    student_age: formData.studentAge,
    is_first_time: formData.isFirstTime === "yes",
    note: formData.note || null,
  };

  const { data, error } = await supabase
    .from("registrations")
    .insert(newPayload)
    .select("id")
    .single();

  if (!error && data) {
    return { id: data.id };
  }

  if (error?.code !== "42703" && !error?.message.includes("course_id")) {
    if (error?.message.includes("CLASS_FULL")) {
      return { id: null, error: "此課程已額滿" };
    }
    console.error("Registration insert failed:", error?.message);
    return { id: null, error: "建立報名紀錄失敗" };
  }

  const legacyPayload = {
    course_slug: courseId,
    session_date: sessionDate || "2099-01-01",
    class_id: "A",
    class_name: courseTitle,
    class_time: sessionTime || "—",
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    student_name: formData.studentName,
    student_age: formData.studentAge,
    is_first_time: formData.isFirstTime === "yes",
    note: formData.note || null,
  };

  const legacyResult = await supabase
    .from("registrations")
    .insert(legacyPayload)
    .select("id")
    .single();

  if (legacyResult.error) {
    if (legacyResult.error.message.includes("CLASS_FULL")) {
      return { id: null, error: "此課程已額滿" };
    }
    console.error("Legacy registration insert failed:", legacyResult.error.message);
    return { id: null, error: "建立報名紀錄失敗" };
  }

  return { id: legacyResult.data?.id ?? null };
}

export async function fulfillPaidOrder(input: {
  merchantTradeNo: string;
  ecpayTradeNo?: string | null;
  paymentType?: string | null;
}): Promise<FulfillOrderResult> {
  const order = await getOrderByMerchantTradeNo(input.merchantTradeNo);

  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  if (order.status === "paid") {
    return { success: true, alreadyPaid: true };
  }

  if (order.status !== "pending") {
    return { success: false, error: "訂單狀態不可完成付款" };
  }

  const course = await getCourseWithEnrollment(order.course_id);

  if (!course) {
    return { success: false, error: "找不到課程" };
  }

  if (!course.isOpen) {
    return { success: false, error: "課程已關閉" };
  }

  if (course.isFull) {
    return { success: false, error: "此課程已額滿" };
  }

  const registration = await insertPaidRegistration(
    order.id,
    order.course_id,
    order.form_data,
    course.title,
    course.sessionDate,
    course.sessionTime,
  );

  if (!registration.id) {
    return { success: false, error: registration.error ?? "建立報名失敗" };
  }

  const paidAt = new Date().toISOString();
  const updated = await updateOrderStatus(order.id, {
    status: "paid",
    payment_method: formatEcpayPaymentMethod(input.paymentType),
    ecpay_trade_no: input.ecpayTradeNo ?? null,
    registration_id: registration.id,
    paid_at: paidAt,
  });

  if (!updated) {
    return { success: false, error: "更新訂單失敗" };
  }

  revalidatePath(`/courses/${order.course_id}`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  try {
    const enrollmentCount = await getEnrollmentCount(course.id);
    await sendRegistrationNotifications({
      course,
      formData: order.form_data,
      enrollmentCount,
    });
  } catch (error) {
    console.error("Registration email notification failed:", error);
  }

  return { success: true, alreadyPaid: false };
}
