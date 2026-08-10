import { mapCoursePlanRow, mapCoursePlanToDb } from "@/lib/course-plans/mappers";
import type { CoursePlan, CoursePlanFormInput } from "@/lib/course-plans/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function getCoursePlansByCourseId(
  courseId: string,
  options?: { activeOnly?: boolean },
): Promise<CoursePlan[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerClient();
  let query = supabase
    .from("course_plans")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "PGRST205") return [];
    console.error("Failed to fetch course plans:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapCoursePlanRow(row));
}

export async function getVisibleCoursePlansByCourseId(
  courseId: string,
): Promise<CoursePlan[]> {
  return getCoursePlansByCourseId(courseId, { activeOnly: true });
}

export async function getCoursePlanById(planId: string): Promise<CoursePlan | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("course_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (error || !data) {
    if (error && error.code !== "PGRST205") {
      console.error("Failed to fetch course plan:", error.message);
    }
    return null;
  }

  return mapCoursePlanRow(data);
}

export async function saveCoursePlan(input: {
  id?: string;
  courseId: string;
  values: CoursePlanFormInput;
}): Promise<{ success: true; plan: CoursePlan } | { success: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const row = mapCoursePlanToDb(input.courseId, input.values);

  if (input.id) {
    const { data, error } = await supabase
      .from("course_plans")
      .update(row)
      .eq("id", input.id)
      .eq("course_id", input.courseId)
      .select("*")
      .single();

    if (error) {
      console.error("Update course plan failed:", error.message);
      if (error.code === "PGRST205") {
        return { success: false, error: "請先在 Supabase 執行 040_course_plans.sql" };
      }
      return { success: false, error: "更新課程方案失敗" };
    }

    return { success: true, plan: mapCoursePlanRow(data) };
  }

  const { data, error } = await supabase
    .from("course_plans")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("Create course plan failed:", error.message);
    if (error.code === "PGRST205") {
      return { success: false, error: "請先在 Supabase 執行 040_course_plans.sql" };
    }
    return { success: false, error: "新增課程方案失敗" };
  }

  return { success: true, plan: mapCoursePlanRow(data) };
}

export async function deleteCoursePlan(
  planId: string,
  courseId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("course_plans")
    .delete()
    .eq("id", planId)
    .eq("course_id", courseId);

  if (error) {
    console.error("Delete course plan failed:", error.message);
    if (error.code === "PGRST205") {
      return { success: false, error: "請先在 Supabase 執行 040_course_plans.sql" };
    }
    return { success: false, error: "刪除課程方案失敗" };
  }

  return { success: true };
}
