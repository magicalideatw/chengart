"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  COURSE_COVER_ALLOWED_TYPES,
  COURSE_COVER_MAX_FILE_SIZE,
  COURSE_COVERS_BUCKET,
} from "@/lib/courses/constants";
import { mapCourseToDb } from "@/lib/courses/mappers";
import type { AdminActionResult } from "@/lib/admin/types";
import type { CourseFormInput } from "@/lib/courses/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { adminCourseSchema } from "@/lib/validation/admin-course-schema";

function mutationUnavailable(): AdminActionResult {
  return {
    success: false,
    error: "Supabase 尚未設定，無法操作課程",
  };
}

async function getMutationClient() {
  if (!isSupabaseConfigured()) return null;
  return createServerClient();
}

function revalidateCoursePaths() {
  revalidatePath("/");
  revalidatePath("/admin/courses");
}

export async function createCourse(
  input: CourseFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminCourseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("courses")
    .insert(mapCourseToDb(parsed.data));

  if (error) {
    console.error("Create course failed:", error.message);
    return {
      success: false,
      error:
        error.code === "42501"
          ? "無寫入權限。請確認已登入，並在 Supabase 執行 004_admin_auth_policies.sql"
          : "新增課程失敗，請稍後再試",
    };
  }

  revalidateCoursePaths();
  return { success: true };
}

export async function updateCourse(
  id: string,
  input: CourseFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminCourseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("courses")
    .update(mapCourseToDb(parsed.data))
    .eq("id", id);

  if (error) {
    console.error("Update course failed:", error.message);
    return {
      success: false,
      error:
        error.code === "42501"
          ? "無寫入權限。請確認已登入，並在 Supabase 執行 004_admin_auth_policies.sql"
          : "更新課程失敗，請稍後再試",
    };
  }

  revalidateCoursePaths();
  revalidatePath(`/courses/${id}`);
  return { success: true };
}

export async function deleteCourse(id: string): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { success: false, error: "此課程已有報名紀錄，無法刪除" };
    }

    console.error("Delete course failed:", error.message);
    return {
      success: false,
      error:
        error.code === "42501"
          ? "無寫入權限。請確認已登入，並在 Supabase 執行 004_admin_auth_policies.sql"
          : "刪除課程失敗，請稍後再試",
    };
  }

  revalidateCoursePaths();
  return { success: true };
}

export type UploadCourseCoverResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadCourseCover(
  formData: FormData,
): Promise<UploadCourseCoverResult> {
  await requireAuthenticatedUser();

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "請選擇圖片檔案" };
  }

  if (!COURSE_COVER_ALLOWED_TYPES.has(file.type)) {
    return { success: false, error: "僅支援 JPG、PNG、WebP 格式" };
  }

  if (file.size > COURSE_COVER_MAX_FILE_SIZE) {
    return { success: false, error: "圖片大小不可超過 30MB" };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const supabase = await createServerClient();
  const { error } = await supabase.storage
    .from(COURSE_COVERS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload course cover failed:", error.message);
    return {
      success: false,
      error:
        error.message.includes("Bucket not found")
          ? "請先在 Supabase 執行 019_course_covers_storage.sql"
          : "上傳圖片失敗，請稍後再試",
    };
  }

  const { data } = supabase.storage.from(COURSE_COVERS_BUCKET).getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}
