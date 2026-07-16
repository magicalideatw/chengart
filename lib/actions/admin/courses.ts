"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  COURSE_COVER_ALLOWED_TYPES,
  COURSE_COVER_MAX_FILE_SIZE,
  COURSE_COVERS_BUCKET,
} from "@/lib/courses/constants";
import { buildCourseCoverStoragePath } from "@/lib/courses/cover-image";
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

type PostgrestErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function formatSupabaseError(error: PostgrestErrorLike | Error | unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (!error || typeof error !== "object") {
    return String(error ?? "Unknown error");
  }

  const pgError = error as PostgrestErrorLike;
  const lines = [
    pgError.message ? `message: ${pgError.message}` : null,
    pgError.code ? `code: ${pgError.code}` : null,
    pgError.details ? `details: ${pgError.details}` : null,
    pgError.hint ? `hint: ${pgError.hint}` : null,
  ].filter(Boolean);

  return lines.join("\n") || "Unknown error";
}

export async function createCourse(
  input: CourseFormInput,
): Promise<AdminActionResult> {
  try {
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
      console.error("[createCourseAction]", error);
      console.error({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === "42501") {
        return {
          success: false,
          error: `無寫入權限。請確認已登入，並在 Supabase 執行 004_admin_auth_policies.sql\n${formatSupabaseError(error)}`,
        };
      }

      return {
        success: false,
        error: `新增課程失敗\n${formatSupabaseError(error)}`,
      };
    }

    revalidateCoursePaths();
    return { success: true };
  } catch (error) {
    console.error("[createCourseAction]", error);
    return {
      success: false,
      error: `新增課程失敗\n${formatSupabaseError(error)}`,
    };
  }
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

export async function deleteCourse(_id: string): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  return {
    success: false,
    error: "請使用活動管理中的「刪除活動」對話框（封存或永久刪除）",
  };
}

export type UploadCourseCoverResult =
  | { success: true; path: string }
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
  const filename = `${crypto.randomUUID()}.${extension}`;

  const supabase = await createServerClient();
  const { error } = await supabase.storage
    .from(COURSE_COVERS_BUCKET)
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload course cover failed:", error.message);
    return {
      success: false,
      error:
        error.message.includes("Bucket not found")
          ? "請先在 Supabase 執行 010_event_covers_storage.sql"
          : "上傳圖片失敗，請稍後再試",
    };
  }

  return { success: true, path: buildCourseCoverStoragePath(filename) };
}
