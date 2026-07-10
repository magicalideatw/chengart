import { mapClassRow } from "@/lib/classes/mappers";
import type { CourseClass } from "@/lib/classes/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function usesClassesTable(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createServerClient();
  const { error } = await supabase.from("classes").select("id").limit(1);

  if (error) {
    if (error.code === "PGRST205") return false;
    console.error("Failed to check classes table:", error.message);
    return false;
  }

  return true;
}

export async function getClassesByCourseId(
  courseId: string,
): Promise<CourseClass[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "PGRST205") return [];
    console.error("Failed to fetch classes:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapClassRow(row));
}

export async function getClassById(classId: string): Promise<CourseClass | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205") return null;
    console.error("Failed to fetch class:", error.message);
    return null;
  }

  return data ? mapClassRow(data) : null;
}

export async function getClassCountsByCourseIds(
  courseIds: string[],
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || courseIds.length === 0) return {};

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("classes")
    .select("course_id")
    .in("course_id", courseIds);

  if (error) {
    if (error.code === "PGRST205") return {};
    console.error("Failed to fetch class counts:", error.message);
    return {};
  }

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    const courseId = String(row.course_id);
    counts[courseId] = (counts[courseId] ?? 0) + 1;
    return counts;
  }, {});
}
