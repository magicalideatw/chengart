import { revalidatePath } from "next/cache";
import { formatEcpayPaymentMethod } from "@/lib/ecpay/payment-method";
import { getCourseWithEnrollment, getEnrollmentCount } from "@/lib/courses/queries";
import { sendRegistrationNotifications } from "@/lib/email/send-registration-notifications";
import {
  getOrderByMerchantTradeNo,
  updateOrderStatus,
} from "@/lib/orders/queries";
import { validateSessionSelection } from "@/lib/registration/queries";
import {
  getSessionIdsFromFormData,
  usesMultiSessionRegistration,
  type RegistrationOrderFormData,
} from "@/lib/registration/types";
import { createPaymentClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/database.types";

export type FulfillOrderResult =
  | { success: true; alreadyPaid: boolean }
  | { success: false; error: string };

async function insertPaidRegistration(
  orderId: string,
  courseId: string,
  formData: RegistrationOrderFormData,
  courseTitle: string,
  sessionDate: string,
  sessionTime: string,
  sessionId?: string | null,
): Promise<{ id: string | null; error?: string }> {
  const supabase = await createPaymentClient();

  const newPayload: Database["public"]["Tables"]["registrations"]["Insert"] = {
    course_id: courseId,
    order_id: orderId,
    status: "paid",
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    student_name: formData.studentName,
    student_age: formData.studentAge,
    is_first_time: formData.isFirstTime === "yes",
    note: formData.note || null,
    session_id: sessionId ?? null,
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

async function decrementSessionCapacity(sessionId: string): Promise<boolean> {
  const supabase = await createPaymentClient();

  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("id, remaining_capacity, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError || !session) {
    console.error("Failed to fetch session for capacity update:", fetchError?.message);
    return false;
  }

  if (session.remaining_capacity <= 0 || session.status !== "open") {
    return false;
  }

  const nextRemaining = session.remaining_capacity - 1;
  const { data, error } = await supabase
    .from("sessions")
    .update({
      remaining_capacity: nextRemaining,
      status: nextRemaining <= 0 ? "full" : session.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("remaining_capacity", session.remaining_capacity)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to decrement session capacity:", error?.message);
    return false;
  }

  return true;
}

async function fulfillMultiSessionOrder(
  orderId: string,
  courseId: string,
  formData: RegistrationOrderFormData,
): Promise<{ registrationId: string | null; error?: string }> {
  const sessionIds = getSessionIdsFromFormData(formData);
  const validation = await validateSessionSelection(courseId, sessionIds);

  if (!validation.success) {
    return { registrationId: null, error: validation.error };
  }

  let firstRegistrationId: string | null = null;

  for (const session of validation.data.sessions) {
    const registration = await insertPaidRegistration(
      orderId,
      courseId,
      formData,
      "",
      session.date,
      `${session.startTime}~${session.endTime}`,
      session.id,
    );

    if (!registration.id) {
      return {
        registrationId: firstRegistrationId,
        error: registration.error ?? "建立報名失敗",
      };
    }

    if (!firstRegistrationId) {
      firstRegistrationId = registration.id;
    }

    const decremented = await decrementSessionCapacity(session.id);
    if (!decremented) {
      return { registrationId: firstRegistrationId, error: "上課日期名額已變動，請聯絡管理員" };
    }
  }

  return { registrationId: firstRegistrationId };
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

  const formData = order.form_data as RegistrationOrderFormData;
  let registrationId: string | null = null;

  if (usesMultiSessionRegistration(formData)) {
    const result = await fulfillMultiSessionOrder(order.id, order.course_id, formData);
    registrationId = result.registrationId;

    if (!registrationId) {
      return { success: false, error: result.error ?? "建立報名失敗" };
    }
  } else {
    if (course.isFull) {
      return { success: false, error: "此課程已額滿" };
    }

    const registration = await insertPaidRegistration(
      order.id,
      order.course_id,
      formData,
      course.title,
      course.sessionDate,
      course.sessionTime,
    );

    if (!registration.id) {
      return { success: false, error: registration.error ?? "建立報名失敗" };
    }

    registrationId = registration.id;
  }

  const paidAt = new Date().toISOString();
  const updated = await updateOrderStatus(order.id, {
    status: "paid",
    payment_method: formatEcpayPaymentMethod(input.paymentType),
    ecpay_trade_no: input.ecpayTradeNo ?? null,
    registration_id: registrationId,
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
      formData,
      enrollmentCount,
    });
  } catch (error) {
    console.error("Registration email notification failed:", error);
  }

  return { success: true, alreadyPaid: false };
}
