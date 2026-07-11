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
import { createPaymentClient, isServiceClientConfigured } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/database.types";

export type FulfillOrderResult =
  | { success: true; alreadyPaid: boolean }
  | { success: false; error: string };

type InsertPaidRegistrationResult =
  | { success: true; id: string }
  | { success: false; error: string };

type FulfillMultiSessionResult =
  | { success: true; registrationIds: string[] }
  | { success: false; error: string; registrationIds: string[] };

async function insertPaidRegistration(
  orderId: string,
  courseId: string,
  formData: RegistrationOrderFormData,
  courseTitle: string,
  sessionDate: string,
  sessionTime: string,
  sessionId?: string | null,
): Promise<InsertPaidRegistrationResult> {
  const supabase = createPaymentClient();

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
    ...(sessionId ? { session_id: sessionId } : {}),
  };

  console.log("creating registration", sessionId ?? "(legacy)");

  const { data, error } = await supabase
    .from("registrations")
    .insert(newPayload)
    .select("id")
    .single();

  if (!error && data) {
    console.log("registration created", { id: data.id, sessionId: sessionId ?? null });
    return { success: true, id: data.id };
  }

  if (sessionId) {
    if (error?.message.includes("CLASS_FULL")) {
      return { success: false, error: "此上課日期已額滿" };
    }
    if (error?.message.includes("SESSION_NOT_FOUND")) {
      return { success: false, error: "上課日期不存在" };
    }
    console.error("Registration insert failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      payload: newPayload,
      usingServiceRole: isServiceClientConfigured(),
    });
    return { success: false, error: "建立報名紀錄失敗" };
  }

  if (error?.code !== "42703" && !error?.message.includes("course_id")) {
    if (error?.message.includes("CLASS_FULL")) {
      return { success: false, error: "此課程已額滿" };
    }
    console.error("Registration insert failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      payload: newPayload,
    });
    return { success: false, error: "建立報名紀錄失敗" };
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
      return { success: false, error: "此課程已額滿" };
    }
    console.error("Legacy registration insert failed", {
      code: legacyResult.error.code,
      message: legacyResult.error.message,
      details: legacyResult.error.details,
      hint: legacyResult.error.hint,
    });
    return { success: false, error: "建立報名紀錄失敗" };
  }

  if (!legacyResult.data?.id) {
    return { success: false, error: "建立報名紀錄失敗" };
  }

  console.log("legacy registration created", { id: legacyResult.data.id });
  return { success: true, id: legacyResult.data.id };
}

async function decrementSessionCapacity(sessionId: string): Promise<boolean> {
  const supabase = createPaymentClient();

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
): Promise<FulfillMultiSessionResult> {
  const sessionIds = getSessionIdsFromFormData(formData);
  console.log("sessionIds", sessionIds);

  if (sessionIds.length === 0) {
    return { success: false, error: "訂單缺少上課日期", registrationIds: [] };
  }

  const validation = await validateSessionSelection(courseId, sessionIds);
  if (!validation.success) {
    console.error("Session validation failed during fulfill:", validation.error);
    return { success: false, error: validation.error, registrationIds: [] };
  }

  const sessionById = new Map(
    validation.data.sessions.map((session) => [session.id, session]),
  );

  const registrationIds: string[] = [];

  for (const sessionId of sessionIds) {
    const session = sessionById.get(sessionId);
    if (!session) {
      console.error("Session missing during fulfill:", sessionId);
      return {
        success: false,
        error: "部分上課日期不存在，請聯絡管理員",
        registrationIds,
      };
    }

    const registration = await insertPaidRegistration(
      orderId,
      courseId,
      formData,
      "",
      session.date,
      `${session.startTime}~${session.endTime}`,
      sessionId,
    );

    if (!registration.success) {
      console.error("Multi-session registration insert stopped", {
        sessionId,
        error: registration.error,
        createdCount: registrationIds.length,
      });
      return {
        success: false,
        error: registration.error,
        registrationIds,
      };
    }

    registrationIds.push(registration.id);

    const decremented = await decrementSessionCapacity(sessionId);
    if (!decremented) {
      console.error("Session capacity decrement failed", { sessionId });
      return {
        success: false,
        error: "上課日期名額已變動，請聯絡管理員",
        registrationIds,
      };
    }
  }

  console.log("multi-session registrations created", {
    orderId,
    count: registrationIds.length,
    registrationIds,
  });

  return { success: true, registrationIds };
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

  console.log("fulfillPaidOrder", {
    orderId: order.id,
    merchantTradeNo: input.merchantTradeNo,
    usesMultiSession: usesMultiSessionRegistration(formData),
    formSessionIds: formData.sessionIds,
  });

  if (usesMultiSessionRegistration(formData)) {
    const result = await fulfillMultiSessionOrder(order.id, order.course_id, formData);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    registrationId = result.registrationIds[0] ?? null;

    if (!registrationId) {
      return { success: false, error: "建立報名失敗" };
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

    if (!registration.success) {
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
