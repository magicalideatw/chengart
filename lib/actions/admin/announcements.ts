"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import type { AnnouncementFormInput } from "@/lib/announcements/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { adminAnnouncementSchema } from "@/lib/validation/admin-announcement-schema";

function toDbPayload(input: AnnouncementFormInput) {
  return {
    title: input.title,
    content: input.content,
    is_active: input.isActive,
    sort_order: input.sortOrder,
    starts_at: input.startsAt ? new Date(input.startsAt).toISOString() : null,
    ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

function revalidateAnnouncementPaths() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
}

export async function createAnnouncement(
  input: AnnouncementFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("homepage_announcements")
    .insert(toDbPayload(parsed.data));

  if (error) {
    console.error("Create announcement failed:", error.message);
    return {
      success: false,
      error:
        error.code === "PGRST205"
          ? "請先在 Supabase 執行 007_homepage_announcements.sql"
          : "新增公告失敗，請稍後再試",
    };
  }

  revalidateAnnouncementPaths();
  return { success: true };
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("homepage_announcements")
    .update(toDbPayload(parsed.data))
    .eq("id", id);

  if (error) {
    console.error("Update announcement failed:", error.message);
    return { success: false, error: "更新公告失敗，請稍後再試" };
  }

  revalidateAnnouncementPaths();
  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("homepage_announcements")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete announcement failed:", error.message);
    return { success: false, error: "刪除公告失敗，請稍後再試" };
  }

  revalidateAnnouncementPaths();
  return { success: true };
}
