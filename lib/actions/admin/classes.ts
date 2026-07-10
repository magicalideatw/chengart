"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { mapClassToDb } from "@/lib/classes/mappers";
import type { ClassFormInput } from "@/lib/classes/types";
import type { AdminActionResult } from "@/lib/admin/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { adminClassSchema } from "@/lib/validation/admin-class-schema";

function mutationUnavailable(): AdminActionResult {
  return {
    success: false,
    error: "Supabase 尚未設定，無法操作班別",
  };
}

function tableMissingMessage(): AdminActionResult {
  return {
    success: false,
    error: "請先在 Supabase 執行 011_create_classes.sql",
  };
}

async function getMutationClient() {
  if (!isSupabaseConfigured()) return null;
  return createServerClient();
}

function revalidateClassPaths(courseId: string) {
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/classes`);
}

export async function createClass(
  courseId: string,
  input: ClassFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminClassSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("classes")
    .insert(mapClassToDb(courseId, parsed.data));

  if (error) {
    console.error("Create class failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    if (error.code === "23503") {
      return { success: false, error: "找不到此課程" };
    }
    return { success: false, error: "新增班別失敗，請稍後再試" };
  }

  revalidateClassPaths(courseId);
  return { success: true };
}

export async function updateClass(
  courseId: string,
  classId: string,
  input: ClassFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminClassSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("classes")
    .update(mapClassToDb(courseId, parsed.data))
    .eq("id", classId)
    .eq("course_id", courseId);

  if (error) {
    console.error("Update class failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    return { success: false, error: "更新班別失敗，請稍後再試" };
  }

  revalidateClassPaths(courseId);
  return { success: true };
}

export async function deleteClass(
  courseId: string,
  classId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId)
    .eq("course_id", courseId);

  if (error) {
    console.error("Delete class failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    return { success: false, error: "刪除班別失敗，請稍後再試" };
  }

  revalidateClassPaths(courseId);
  return { success: true };
}
