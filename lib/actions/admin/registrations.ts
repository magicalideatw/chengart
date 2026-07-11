"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult, AdminOrderUpdate } from "@/lib/admin/types";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import {
  calculateOrderTotal,
  getEffectivePricePerStudent,
} from "@/lib/registration/pricing";
import {
  getCourseRegistrationPlan,
  validateSessionSelection,
} from "@/lib/registration/queries";
import type { RegistrationOrderFormData } from "@/lib/registration/types";
import { formatSessionCheckboxLabel } from "@/lib/sessions/format";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/database.types";
import {
  adminOrderUpdateSchema,
  type AdminOrderUpdateInput,
} from "@/lib/validation/admin-registration-schema";

function mutationUnavailable(): AdminActionResult {
  return {
    success: false,
    error: "無法修改或刪除資料。請確認已登入管理員",
  };
}

async function getMutationClient() {
  if (!isSupabaseConfigured()) return null;
  return createServerClient();
}

async function incrementSessionCapacity(sessionId: string): Promise<void> {
  const supabase = await getMutationClient();
  if (!supabase) return;

  const { data: session } = await supabase
    .from("sessions")
    .select("id, remaining_capacity, capacity, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return;

  const nextRemaining = Math.min(
    session.remaining_capacity + 1,
    session.capacity,
  );

  await supabase
    .from("sessions")
    .update({
      remaining_capacity: nextRemaining,
      status: nextRemaining > 0 && session.status === "full" ? "open" : session.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

async function decrementSessionCapacity(sessionId: string): Promise<boolean> {
  const supabase = await getMutationClient();
  if (!supabase) return false;

  const { data: session } = await supabase
    .from("sessions")
    .select("id, remaining_capacity, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.remaining_capacity <= 0 || session.status !== "open") {
    return false;
  }

  const nextRemaining = session.remaining_capacity - 1;
  const { data } = await supabase
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

  return Boolean(data);
}

export async function deleteRegistration(ids: string[]): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, error: "找不到要刪除的報名資料" };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { data: rows } = await supabase
    .from("registrations")
    .select("id, session_id, order_id")
    .in("id", uniqueIds);

  for (const row of rows ?? []) {
    if (row.session_id) {
      await incrementSessionCapacity(row.session_id);
    }
  }

  const orderIds = [
    ...new Set((rows ?? []).map((row) => row.order_id).filter(Boolean)),
  ] as string[];

  const { error } = await supabase
    .from("registrations")
    .delete()
    .in("id", uniqueIds);

  if (error) {
    console.error("Delete registration failed:", error.message);
    return {
      success: false,
      error:
        error.code === "42501"
          ? "無刪除權限。請在 Supabase 執行 004_admin_auth_policies.sql"
          : "刪除失敗，請稍後再試",
    };
  }

  for (const orderId of orderIds) {
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId);

    if ((count ?? 0) === 0) {
      await supabase.from("students").delete().eq("order_id", orderId);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  return { success: true };
}

export async function updateOrderRegistration(
  input: AdminOrderUpdate,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminOrderUpdateSchema.safeParse({
    ...input,
    parentNote: input.parentNote ?? "",
    students: input.students.map((student) => ({
      ...student,
      note: student.note ?? "",
      gender: student.gender ?? "",
      sessionIds: student.sessionIds ?? [],
      registrationIds: student.registrationIds ?? [],
    })),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "表單資料有誤";
    return { success: false, error: firstError };
  }

  const data: AdminOrderUpdateInput = parsed.data;
  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const course = await getCourseWithEnrollment(data.courseId);
  if (!course) {
    return { success: false, error: "找不到所選課程" };
  }

  const plan = await getCourseRegistrationPlan(data.courseId);
  const usesSessions = plan?.usesSessions ?? false;

  const parentPayload = {
    course_id: data.courseId,
    name: data.name,
    phone: data.phone,
    email: data.email,
  };

  const { error: parentUpdateError } = await supabase
    .from("registrations")
    .update(parentPayload)
    .in("id", data.registrationIds);

  if (parentUpdateError) {
    const legacyPayload = {
      course_slug: data.courseId,
      name: data.name,
      phone: data.phone,
      email: data.email,
    };

    const { error: legacyError } = await supabase
      .from("registrations")
      .update(legacyPayload)
      .in("id", data.registrationIds);

    if (legacyError) {
      console.error("Update parent fields failed:", legacyError.message);
      return { success: false, error: "更新家長資料失敗" };
    }
  }

  if (data.orderId) {
    const { data: orderRow } = await supabase
      .from("orders")
      .select("form_data")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderRow?.form_data && typeof orderRow.form_data === "object") {
      const formData = {
        ...(orderRow.form_data as Record<string, unknown>),
        name: data.name,
        phone: data.phone,
        email: data.email,
        parentNote: data.parentNote || undefined,
      };

      await supabase
        .from("orders")
        .update({ form_data: formData })
        .eq("id", data.orderId);
    }
  }

  const existingStudentIds = new Set<string>();

  for (const [index, student] of data.students.entries()) {
    let studentId = student.id ?? null;

    const studentFields = {
      student_name: student.studentName,
      student_age: student.studentAge,
      gender: student.gender?.trim() || null,
      is_first_time: student.isFirstTime,
      note: student.note?.trim() || data.parentNote?.trim() || null,
      sort_order: index,
    };

    if (data.orderId) {
      if (studentId) {
        const { error } = await supabase
          .from("students")
          .update(studentFields)
          .eq("id", studentId)
          .eq("order_id", data.orderId);

        if (error) {
          console.error("Update student failed:", error.message);
          return { success: false, error: "更新學生資料失敗" };
        }
      } else {
        const insertPayload: Database["public"]["Tables"]["students"]["Insert"] = {
          order_id: data.orderId,
          ...studentFields,
        };

        const { data: inserted, error } = await supabase
          .from("students")
          .insert(insertPayload)
          .select("id")
          .single();

        if (error || !inserted) {
          console.error("Insert student failed:", error?.message);
          return { success: false, error: "新增學生失敗" };
        }

        studentId = inserted.id;
      }

      if (studentId) {
        existingStudentIds.add(studentId);
      }
    }

    const registrationStudentPayload = {
      ...parentPayload,
      student_name: student.studentName,
      student_age: student.studentAge,
      is_first_time: student.isFirstTime,
      note: student.note?.trim() || data.parentNote?.trim() || null,
      ...(studentId ? { student_id: studentId } : {}),
    };

    if (student.registrationIds.length > 0) {
      const { error } = await supabase
        .from("registrations")
        .update(registrationStudentPayload)
        .in("id", student.registrationIds);

      if (error) {
        console.error("Update student registrations failed:", error.message);
        return { success: false, error: "更新學生報名資料失敗" };
      }
    }

    if (!usesSessions) continue;

    let currentRows: Array<{ id: string; session_id: string | null }> = [];

    if (student.registrationIds.length > 0) {
      const { data: registrationRows } = await supabase
        .from("registrations")
        .select("id, session_id")
        .in("id", student.registrationIds);
      currentRows = registrationRows ?? [];
    } else if (studentId && data.orderId) {
      const { data: registrationRows } = await supabase
        .from("registrations")
        .select("id, session_id")
        .eq("student_id", studentId)
        .eq("order_id", data.orderId);
      currentRows = registrationRows ?? [];
    }

    const currentBySession = new Map<string, string>();
    for (const row of currentRows ?? []) {
      if (row.session_id) {
        currentBySession.set(row.session_id, row.id);
      }
    }

    const desiredSessionIds = [...new Set(student.sessionIds)];
    const validation = await validateSessionSelection(data.courseId, desiredSessionIds);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const toRemove = [...currentBySession.keys()].filter(
      (sessionId) => !desiredSessionIds.includes(sessionId),
    );
    const toAdd = desiredSessionIds.filter(
      (sessionId) => !currentBySession.has(sessionId),
    );

    for (const sessionId of toRemove) {
      const registrationId = currentBySession.get(sessionId);
      if (!registrationId) continue;

      const { error } = await supabase
        .from("registrations")
        .delete()
        .eq("id", registrationId);

      if (error) {
        return { success: false, error: "移除報名時段失敗" };
      }

      await incrementSessionCapacity(sessionId);
    }

    for (const sessionId of toAdd) {
      const session = validation.data.sessions.find((item) => item.id === sessionId);
      if (!session) {
        return { success: false, error: "部分上課日期不存在" };
      }

      const decremented = await decrementSessionCapacity(sessionId);
      if (!decremented) {
        return { success: false, error: "部分上課日期已額滿" };
      }

      const insertPayload: Database["public"]["Tables"]["registrations"]["Insert"] = {
        course_id: data.courseId,
        order_id: data.orderId,
        student_id: studentId,
        session_id: sessionId,
        status: "paid",
        name: data.name,
        phone: data.phone,
        email: data.email,
        student_name: student.studentName,
        student_age: student.studentAge,
        is_first_time: student.isFirstTime,
        note: student.note?.trim() || data.parentNote?.trim() || null,
      };

      const { error } = await supabase.from("registrations").insert(insertPayload);

      if (error) {
        await incrementSessionCapacity(sessionId);
        if (error.message.includes("CLASS_FULL")) {
          return { success: false, error: "部分上課日期已額滿" };
        }
        return { success: false, error: "新增報名時段失敗" };
      }
    }
  }

  if (data.orderId) {
    const { data: allStudents } = await supabase
      .from("students")
      .select("id")
      .eq("order_id", data.orderId);

    const toDelete = (allStudents ?? [])
      .map((row) => row.id)
      .filter((id) => !existingStudentIds.has(id));

    if (toDelete.length > 0) {
      const { error } = await supabase.from("students").delete().in("id", toDelete);
      if (error) {
        return { success: false, error: "刪除學生失敗" };
      }
    }

    const pricePerStudent = getEffectivePricePerStudent(course);
    const studentCount = data.students.length;
    const newAmount = calculateOrderTotal({ pricePerStudent, studentCount });

    const { data: orderRow } = await supabase
      .from("orders")
      .select("form_data")
      .eq("id", data.orderId)
      .maybeSingle();

    const existingFormData =
      orderRow?.form_data && typeof orderRow.form_data === "object"
        ? (orderRow.form_data as RegistrationOrderFormData)
        : ({} as RegistrationOrderFormData);

    const updatedStudents = data.students.map((student, index) => ({
      clientId: existingFormData.students?.[index]?.clientId ?? `student-${index + 1}`,
      studentName: student.studentName,
      studentAge: student.studentAge,
      gender: (student.gender?.trim() || "") as "" | "male" | "female" | "other",
      isFirstTime: student.isFirstTime ? ("yes" as const) : ("no" as const),
      note: student.note?.trim() || "",
      sessionIds: student.sessionIds,
    }));

    const formData: RegistrationOrderFormData = {
      ...existingFormData,
      name: data.name,
      phone: data.phone,
      email: data.email,
      parentNote: data.parentNote || undefined,
      students: updatedStudents,
      unitPrice: pricePerStudent,
    };

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        amount: newAmount,
        form_data: formData,
      })
      .eq("id", data.orderId);

    if (orderUpdateError) {
      console.error("Update order amount failed:", orderUpdateError.message);
      return { success: false, error: "更新訂單金額失敗" };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath(`/courses/${data.courseId}`);
  return { success: true };
}

/** @deprecated use updateOrderRegistration */
export async function updateRegistration(
  input: AdminOrderUpdateInput & {
    ids: string[];
    studentName: string;
    studentAge: string;
    isFirstTime: boolean;
    note: string;
  },
): Promise<AdminActionResult> {
  return updateOrderRegistration({
    orderId: null,
    registrationIds: input.ids,
    courseId: input.courseId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    parentNote: input.note,
    students: [
      {
        studentName: input.studentName,
        studentAge: input.studentAge,
        gender: "",
        isFirstTime: input.isFirstTime,
        note: input.note,
        sessionIds: [],
        registrationIds: input.ids,
      },
    ],
  });
}

export async function getAdminCourseSessionOptions(courseId: string) {
  await requireAuthenticatedUser();

  const plan = await getCourseRegistrationPlan(courseId);
  if (!plan?.usesSessions) {
    return { usesSessions: false as const, classes: [] };
  }

  return {
    usesSessions: true as const,
    classes: plan.classes.map((item) => ({
      classId: item.class.id,
      className: item.class.name,
      weekday: item.class.weekday,
      unitPrice: item.unitPrice,
      sessions: item.sessions.map((session) => ({
        id: session.id,
        label: formatSessionCheckboxLabel(session.date),
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        remainingCapacity: session.remainingCapacity,
        status: session.status,
      })),
    })),
  };
}
