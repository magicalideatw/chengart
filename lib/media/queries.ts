import { mapCourseMediaRow, mapCourseMediaToDb } from "@/lib/media/mappers";
import type { CourseMediaFormInput, CourseMediaRecord } from "@/lib/media/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

function sortMediaItems(items: CourseMediaRecord[]): CourseMediaRecord[] {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function getCourseMediaByCourseId(
  courseId: string,
): Promise<CourseMediaRecord[]> {
  if (!isSupabaseConfigured() || !courseId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("course_media")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code !== "PGRST205") {
      console.error("Failed to fetch course media:", error.message);
    }
    return [];
  }

  return sortMediaItems((data ?? []).map((row) => mapCourseMediaRow(row)));
}

export async function getVisibleCourseMediaByCourseId(
  courseId: string,
): Promise<CourseMediaRecord[]> {
  if (!isSupabaseConfigured() || !courseId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("course_media")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code !== "PGRST205") {
      console.error("Failed to fetch visible course media:", error.message);
    }
    return [];
  }

  return sortMediaItems((data ?? []).map((row) => mapCourseMediaRow(row)));
}

export async function saveCourseMedia(
  input: CourseMediaFormInput,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const payload = mapCourseMediaToDb(input);

  if (input.id) {
    const { error } = await supabase
      .from("course_media")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  const { error } = await supabase.from("course_media").insert(payload);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCourseMedia(
  mediaId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("course_media").delete().eq("id", mediaId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function copyCourseMedia(
  sourceCourseId: string,
  targetCourseId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const items = await getCourseMediaByCourseId(sourceCourseId);
  if (items.length === 0) {
    return { success: true };
  }

  const supabase = await createServerClient();
  const payload = items.map((item) => ({
    course_id: targetCourseId,
    media_type: item.mediaType,
    title: item.title,
    source_url: item.sourceUrl,
    sort_order: item.sortOrder,
    is_visible: item.isVisible,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("course_media").insert(payload);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
