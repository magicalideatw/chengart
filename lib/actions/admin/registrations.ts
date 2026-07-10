"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type {
  AdminActionResult,
  AdminRegistrationUpdate,
} from "@/lib/admin/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { adminRegistrationSchema } from "@/lib/validation/admin-registration-schema";
import { getCourseWithEnrollment } from "@/lib/courses/queries";

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

export async function deleteRegistration(ids: string[]): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, error: "找不到要刪除的報名資料" };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

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

  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  return { success: true };
}

export async function updateRegistration(
  input: AdminRegistrationUpdate,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminRegistrationSchema.safeParse({
    ...input,
    note: input.note ?? "",
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "表單資料有誤";
    return { success: false, error: firstError };
  }

  const data = parsed.data;
  const uniqueIds = [...new Set(data.ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { success: false, error: "找不到要更新的報名資料" };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const course = await getCourseWithEnrollment(data.courseId);
  if (!course) {
    return { success: false, error: "找不到所選課程" };
  }

  const { data: existingRows } = await supabase
    .from("registrations")
    .select("id, course_id, course_slug")
    .in("id", uniqueIds);

  const isChangingCourse = (existingRows ?? []).some((row) => {
    const existingKey = row.course_id ?? row.course_slug;
    return existingKey !== data.courseId;
  });

  if (isChangingCourse && course.isFull) {
    return { success: false, error: "此課程已額滿，無法移動至此課程" };
  }

  const newPayload = {
    course_id: data.courseId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    student_name: data.studentName,
    student_age: data.studentAge,
    is_first_time: data.isFirstTime,
    note: data.note || null,
  };

  const { error: newSchemaError } = await supabase
    .from("registrations")
    .update(newPayload)
    .in("id", uniqueIds);

  if (!newSchemaError) {
    revalidatePath("/admin");
    revalidatePath("/admin/registrations");
    return { success: true };
  }

  const legacyPayload = {
    course_slug: data.courseId,
    session_date: course.sessionDate || "2099-01-01",
    class_id: "A",
    class_name: course.title,
    class_time: course.sessionTime || "—",
    name: data.name,
    phone: data.phone,
    email: data.email,
    student_name: data.studentName,
    student_age: data.studentAge,
    is_first_time: data.isFirstTime,
    note: data.note || null,
  };

  const { error: legacyError } = await supabase
    .from("registrations")
    .update(legacyPayload)
    .in("id", uniqueIds);

  if (legacyError) {
    if (legacyError.message.includes("CLASS_FULL")) {
      return { success: false, error: "此課程已額滿，無法移動至此課程" };
    }

    console.error("Update registration failed:", legacyError.message);
    return {
      success: false,
      error:
        legacyError.code === "42501"
          ? "無更新權限。請在 Supabase 執行 004_admin_auth_policies.sql"
          : "更新失敗，請稍後再試",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  return { success: true };
}
