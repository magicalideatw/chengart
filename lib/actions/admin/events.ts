"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import { EVENT_COVERS_BUCKET } from "@/lib/events/constants";
import { mapEventToDb } from "@/lib/events/mappers";
import type { EventFormInput } from "@/lib/events/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { adminEventSchema } from "@/lib/validation/admin-event-schema";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function mutationUnavailable(): AdminActionResult {
  return { success: false, error: "Supabase 尚未設定，無法操作活動" };
}

async function getMutationClient() {
  if (!isSupabaseConfigured()) return null;
  return createServerClient();
}

function revalidateEventPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/events");
  if (slug) {
    revalidatePath(`/events/${slug}`);
  }
}

function tableMissingMessage(): AdminActionResult {
  return {
    success: false,
    error: "請先在 Supabase 執行 009_events_cms.sql",
  };
}

export async function createEvent(
  input: EventFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase.from("events").insert(mapEventToDb(parsed.data));

  if (error) {
    console.error("Create event failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    if (error.code === "23505") {
      return { success: false, error: "此網址代稱已被使用，請改用其他代稱" };
    }
    return { success: false, error: "新增活動失敗，請稍後再試" };
  }

  revalidateEventPaths(parsed.data.slug);
  return { success: true };
}

export async function updateEvent(
  id: string,
  input: EventFormInput,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = adminEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { error } = await supabase
    .from("events")
    .update(mapEventToDb(parsed.data))
    .eq("id", id);

  if (error) {
    console.error("Update event failed:", error.message);
    if (error.code === "PGRST205") return tableMissingMessage();
    if (error.code === "23505") {
      return { success: false, error: "此網址代稱已被使用，請改用其他代稱" };
    }
    return { success: false, error: "更新活動失敗，請稍後再試" };
  }

  revalidateEventPaths(parsed.data.slug);
  return { success: true };
}

export async function deleteEvent(id: string): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const supabase = await getMutationClient();
  if (!supabase) return mutationUnavailable();

  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    if (fetchError.code === "PGRST205") return tableMissingMessage();
    return { success: false, error: "刪除活動失敗，請稍後再試" };
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    console.error("Delete event failed:", error.message);
    return { success: false, error: "刪除活動失敗，請稍後再試" };
  }

  revalidateEventPaths(existing?.slug);
  return { success: true };
}

export type UploadEventCoverResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadEventCover(
  formData: FormData,
): Promise<UploadEventCoverResult> {
  await requireAuthenticatedUser();

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "請選擇圖片檔案" };
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { success: false, error: "僅支援 JPG、PNG、WebP、GIF 格式" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "圖片大小不可超過 5MB" };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const supabase = await createServerClient();
  const { error } = await supabase.storage
    .from(EVENT_COVERS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload event cover failed:", error.message);
    return {
      success: false,
      error:
        error.message.includes("Bucket not found")
          ? "請先在 Supabase 執行 010_event_covers_storage.sql"
          : "上傳封面失敗，請稍後再試",
    };
  }

  const { data } = supabase.storage.from(EVENT_COVERS_BUCKET).getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}
