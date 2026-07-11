import { revalidatePath } from "next/cache";
import type { PaymentMethod } from "@/lib/payment/types";
import { canFulfillOrder, isOrderPaid, type OrderRecord } from "@/lib/orders/types";
import { getCourseWithEnrollment, getEnrollmentCount } from "@/lib/courses/queries";
import { sendRegistrationNotifications } from "@/lib/email/send-registration-notifications";
import { getOrderById, getOrderByMerchantTradeNo, updateOrderStatus } from "@/lib/orders/queries";
import { validateSessionSelection } from "@/lib/registration/queries";
import {
  getSessionIdsFromFormData,
  normalizeStudentsFromFormData,
  usesMultiSessionRegistration,
  type OrderStudentInput,
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

type InsertStudentResult =
  | { success: true; id: string }
  | { success: false; error: string };

type FulfillStudentsResult =
  | { success: true; registrationIds: string[] }
  | { success: false; error: string; registrationIds: string[] };

type ParentContact = {
  name: string;
  phone: string;
  email: string;
  parentNote?: string | null;
};

async function insertStudent(
  orderId: string,
  student: OrderStudentInput,
  sortOrder: number,
): Promise<InsertStudentResult> {
  const supabase = createPaymentClient();

  const payload: Database["public"]["Tables"]["students"]["Insert"] = {
    order_id: orderId,
    student_name: student.studentName,
    student_age: student.studentAge,
    gender: student.gender?.trim() || null,
    is_first_time: student.isFirstTime === "yes",
    note: student.note?.trim() || null,
    sort_order: sortOrder,
  };

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Student insert failed", {
      code: error?.code,
      message: error?.message,
      payload,
      usingServiceRole: isServiceClientConfigured(),
    });
    return { success: false, error: "建立學生資料失敗" };
  }

  console.log("student created", { id: data.id, name: student.studentName });
  return { success: true, id: data.id };
}

async function insertPaidRegistration(input: {
  orderId: string;
  courseId: string;
  studentId: string | null;
  parent: ParentContact;
  student: OrderStudentInput;
  courseTitle: string;
  sessionDate: string;
  sessionTime: string;
  sessionId?: string | null;
}): Promise<InsertPaidRegistrationResult> {
  const supabase = createPaymentClient();

  const newPayload: Database["public"]["Tables"]["registrations"]["Insert"] = {
    course_id: input.courseId,
    order_id: input.orderId,
    student_id: input.studentId,
    status: "paid",
    name: input.parent.name,
    phone: input.parent.phone,
    email: input.parent.email,
    student_name: input.student.studentName,
    student_age: input.student.studentAge,
    is_first_time: input.student.isFirstTime === "yes",
    note: input.student.note?.trim() || input.parent.parentNote || null,
    ...(input.sessionId ? { session_id: input.sessionId } : {}),
  };

  console.log("creating registration", input.sessionId ?? "(legacy)");

  const { data, error } = await supabase
    .from("registrations")
    .insert(newPayload)
    .select("id")
    .single();

  if (!error && data) {
    console.log("registration created", {
      id: data.id,
      sessionId: input.sessionId ?? null,
      studentId: input.studentId,
    });
    return { success: true, id: data.id };
  }

  if (input.sessionId || input.studentId) {
    if (error?.message.includes("CLASS_FULL")) {
      return { success: false, error: "此上課日期已額滿" };
    }
    if (error?.message.includes("SESSION_NOT_FOUND")) {
      return { success: false, error: "上課日期不存在" };
    }
    console.error("Registration insert failed", {
      code: error?.code,
      message: error?.message,
      payload: newPayload,
      usingServiceRole: isServiceClientConfigured(),
    });
    return { success: false, error: "建立報名紀錄失敗" };
  }

  if (error?.code !== "42703" && !error?.message.includes("course_id")) {
    if (error?.message.includes("CLASS_FULL")) {
      return { success: false, error: "此課程已額滿" };
    }
    return { success: false, error: "建立報名紀錄失敗" };
  }

  const legacyPayload = {
    course_slug: input.courseId,
    session_date: input.sessionDate || "2099-01-01",
    class_id: "A",
    class_name: input.courseTitle,
    class_time: input.sessionTime || "—",
    name: input.parent.name,
    phone: input.parent.phone,
    email: input.parent.email,
    student_name: input.student.studentName,
    student_age: input.student.studentAge,
    is_first_time: input.student.isFirstTime === "yes",
    note: input.student.note?.trim() || input.parent.parentNote || null,
  };

  const legacyResult = await supabase
    .from("registrations")
    .insert(legacyPayload)
    .select("id")
    .single();

  if (legacyResult.error || !legacyResult.data?.id) {
    return { success: false, error: "建立報名紀錄失敗" };
  }

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

async function fulfillStudentsOrder(input: {
  orderId: string;
  courseId: string;
  courseTitle: string;
  sessionDate: string;
  sessionTime: string;
  formData: RegistrationOrderFormData;
  usesSessions: boolean;
}): Promise<FulfillStudentsResult> {
  const students = normalizeStudentsFromFormData(input.formData);
  const sessionIds = getSessionIdsFromFormData(input.formData);
  console.log("sessionIds", sessionIds);
  console.log("students", students.length);

  if (students.length === 0) {
    return { success: false, error: "訂單缺少學生資料", registrationIds: [] };
  }

  const parent: ParentContact = {
    name: input.formData.name,
    phone: input.formData.phone,
    email: input.formData.email,
    parentNote: input.formData.parentNote ?? input.formData.note ?? null,
  };

  let sessionById = new Map<string, { date: string; startTime: string; endTime: string }>();

  if (input.usesSessions) {
    if (sessionIds.length === 0) {
      return { success: false, error: "訂單缺少上課日期", registrationIds: [] };
    }

    const validation = await validateSessionSelection(input.courseId, sessionIds);
    if (!validation.success) {
      return { success: false, error: validation.error, registrationIds: [] };
    }

    sessionById = new Map(
      validation.data.sessions.map((session) => [
        session.id,
        {
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
        },
      ]),
    );
  }

  const registrationIds: string[] = [];

  for (const [index, student] of students.entries()) {
    const studentRow = await insertStudent(input.orderId, student, index);
    if (!studentRow.success) {
      return {
        success: false,
        error: studentRow.error,
        registrationIds,
      };
    }

    const studentSessionIds = student.sessionIds ?? [];

    if (input.usesSessions) {
      for (const sessionId of studentSessionIds) {
        const session = sessionById.get(sessionId);
        if (!session) {
          return {
            success: false,
            error: "部分上課日期不存在，請聯絡管理員",
            registrationIds,
          };
        }

        const registration = await insertPaidRegistration({
          orderId: input.orderId,
          courseId: input.courseId,
          studentId: studentRow.id,
          parent,
          student,
          courseTitle: input.courseTitle,
          sessionDate: session.date,
          sessionTime: `${session.startTime}~${session.endTime}`,
          sessionId,
        });

        if (!registration.success) {
          return {
            success: false,
            error: registration.error,
            registrationIds,
          };
        }

        registrationIds.push(registration.id);

        const decremented = await decrementSessionCapacity(sessionId);
        if (!decremented) {
          const debugSupabase = createPaymentClient();
          const { data: dbSessions } = await debugSupabase
            .from("sessions")
            .select("id, remaining_capacity, status")
            .in("id", studentSessionIds.length > 0 ? studentSessionIds : [sessionId]);
          const { data: failedSession } = await debugSupabase
            .from("sessions")
            .select("id, remaining_capacity, status")
            .eq("id", sessionId)
            .maybeSingle();

          console.log("Selected Session IDs:", sessionIds);
          console.log("DB Sessions:", dbSessions);
          console.log("Unavailable Sessions:", [sessionId]);
          console.log("Capacity Check:", {
            sessionId,
            decremented,
            studentSessionIds,
            failedSession,
            updateBlocked:
              !failedSession ||
              failedSession.remaining_capacity <= 0 ||
              failedSession.status !== "open",
          });

          return {
            success: false,
            error: "上課日期名額已變動，請聯絡管理員",
            registrationIds,
          };
        }
      }
    } else {
      const registration = await insertPaidRegistration({
        orderId: input.orderId,
        courseId: input.courseId,
        studentId: studentRow.id,
        parent,
        student,
        courseTitle: input.courseTitle,
        sessionDate: input.sessionDate,
        sessionTime: input.sessionTime,
      });

      if (!registration.success) {
        return {
          success: false,
          error: registration.error,
          registrationIds,
        };
      }

      registrationIds.push(registration.id);
    }
  }

  console.log("order registrations created", {
    orderId: input.orderId,
    count: registrationIds.length,
    registrationIds,
  });

  return { success: true, registrationIds };
}

async function completeOrderAfterFulfillment(input: {
  order: OrderRecord;
  paymentMethod: PaymentMethod;
  ecpayTradeNo?: string | null;
}): Promise<FulfillOrderResult> {
  const course = await getCourseWithEnrollment(input.order.course_id);

  if (!course) {
    return { success: false, error: "找不到課程" };
  }

  const formData = input.order.form_data as RegistrationOrderFormData;
  const usesSessions = usesMultiSessionRegistration(formData);

  const result = await fulfillStudentsOrder({
    orderId: input.order.id,
    courseId: input.order.course_id,
    courseTitle: course.title,
    sessionDate: course.sessionDate,
    sessionTime: course.sessionTime,
    formData,
    usesSessions,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const registrationId = result.registrationIds[0] ?? null;
  if (!registrationId) {
    return { success: false, error: "建立報名失敗" };
  }

  const paidAt = new Date().toISOString();
  const updated = await updateOrderStatus(input.order.id, {
    status: "paid",
    payment_status: "paid",
    payment_method: input.paymentMethod,
    ecpay_trade_no: input.ecpayTradeNo ?? input.order.ecpay_trade_no,
    registration_id: registrationId,
    paid_at: paidAt,
  });

  if (!updated) {
    return { success: false, error: "更新訂單失敗" };
  }

  revalidatePath(`/courses/${input.order.course_id}`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/registrations");

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

export async function fulfillOrderById(orderId: string): Promise<FulfillOrderResult> {
  const order = await getOrderById(orderId);

  if (!order) {
    return { success: false, error: "找不到訂單" };
  }

  if (isOrderPaid(order)) {
    return { success: true, alreadyPaid: true };
  }

  if (!canFulfillOrder(order)) {
    return { success: false, error: "訂單狀態不可完成付款" };
  }

  const course = await getCourseWithEnrollment(order.course_id);
  if (!course) {
    return { success: false, error: "找不到課程" };
  }

  if (!course.isOpen) {
    return { success: false, error: "課程已關閉" };
  }

  const paymentMethod = order.payment_method ?? "free";

  return completeOrderAfterFulfillment({
    order,
    paymentMethod,
  });
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

  if (isOrderPaid(order)) {
    return { success: true, alreadyPaid: true };
  }

  if (!canFulfillOrder(order)) {
    return { success: false, error: "訂單狀態不可完成付款" };
  }

  const course = await getCourseWithEnrollment(order.course_id);

  if (!course) {
    return { success: false, error: "找不到課程" };
  }

  if (!course.isOpen) {
    return { success: false, error: "課程已關閉" };
  }

  console.log("fulfillPaidOrder", {
    orderId: order.id,
    merchantTradeNo: input.merchantTradeNo,
    paymentMethod: order.payment_method,
  });

  return completeOrderAfterFulfillment({
    order,
    paymentMethod: "ecpay",
    ecpayTradeNo: input.ecpayTradeNo ?? null,
  });
}
