import {
  isLegacyCourseSchema,
  mapCourseRow,
  toCourseListing,
  withEnrollment,
} from "@/lib/courses/mappers";
import type { HomeActivityType } from "@/lib/courses/activity-type";
import { isPublicCourse } from "@/lib/courses/activity-status";
import type {
  Course,
  CourseListing,
  CourseWithEnrollment,
} from "@/lib/courses/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

async function getSupabase() {
  return createServerClient();
}

function sortCoursesBySessionDate(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => {
    const dateA = a.sessionDate?.trim() || "9999-12-31";
    const dateB = b.sessionDate?.trim() || "9999-12-31";
    return dateA.localeCompare(dateB);
  });
}

function mapPublicCourseListings(rows: Record<string, unknown>[]): CourseListing[] {
  const courses = sortCoursesBySessionDate(
    rows
      .map((row) => mapCourseRow(row))
      .filter((course) => isPublicCourse(course.isOpen)),
  );

  return courses.map(toCourseListing);
}

export async function getPublicCoursesByActivityType(
  activityType: HomeActivityType,
): Promise<CourseListing[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("activity_type", activityType)
    .order("session_date", { ascending: true, nullsFirst: false });

  if (error) {
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (fallbackError) {
        console.error("Failed to fetch public courses:", fallbackError.message);
        return [];
      }

      const courses = sortCoursesBySessionDate(
        (fallbackData ?? [])
          .map((row) => mapCourseRow(row))
          .filter(
            (course) =>
              course.isOpen &&
              course.activityType === activityType,
          ),
      );

      return courses.map(toCourseListing);
    }

    console.error("Failed to fetch public courses:", error.message);
    return [];
  }

  return mapPublicCourseListings(data ?? []);
}

export async function getPublicCourses(): Promise<CourseListing[]> {
  return getPublicCoursesByActivityType("course");
}

export async function getPublicCourseIds(): Promise<string[]> {
  const [courses, performances] = await Promise.all([
    getPublicCoursesByActivityType("course"),
    getPublicCoursesByActivityType("performance"),
  ]);

  return [...courses, ...performances].map((course) => course.id);
}

export async function getAllCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch courses:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapCourseRow(row));
}

export async function getCourseById(id: string): Promise<Course | null> {
  if (!isSupabaseConfigured() || !id) return null;

  const supabase = await getSupabase();

  const byId = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (byId.data) {
    return mapCourseRow(byId.data);
  }

  if (byId.error && byId.error.code !== "42703") {
    console.error("Failed to fetch course by id:", byId.error.message);
  }

  const bySlug = await supabase.from("courses").select("*").eq("slug", id).maybeSingle();
  if (bySlug.error) {
    console.error("Failed to fetch course by slug:", bySlug.error.message);
    return null;
  }

  if (!bySlug.data) return null;
  return mapCourseRow(bySlug.data);
}

export async function getEnrollmentCount(courseId: string): Promise<number> {
  if (!isSupabaseConfigured() || !courseId) return 0;

  const supabase = await getSupabase();

  const byCourseId = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("status", "paid");

  if (!byCourseId.error) {
    return byCourseId.count ?? 0;
  }

  const withoutStatus = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (!withoutStatus.error) {
    return withoutStatus.count ?? 0;
  }

  if (byCourseId.error.code !== "42703" && !byCourseId.error.message.includes("status")) {
    console.error("Failed to fetch enrollment count:", byCourseId.error.message);
    return 0;
  }

  const bySlug = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("course_slug", courseId);

  if (bySlug.error) {
    console.error("Failed to fetch enrollment count by slug:", bySlug.error.message);
    return 0;
  }

  return bySlug.count ?? 0;
}

export async function getCourseWithEnrollment(
  id: string,
): Promise<CourseWithEnrollment | null> {
  const course = await getCourseById(id);
  if (!course) return null;

  const enrollmentCount = await getEnrollmentCount(course.id);
  return withEnrollment(course, enrollmentCount);
}

export async function getEnrollmentCountsByCourseIds(
  courseIds: string[],
): Promise<Record<string, number>> {
  const { unstable_noStore: noStore } = await import("next/cache");
  noStore();

  if (!isSupabaseConfigured() || courseIds.length === 0) return {};

  const supabase = await getSupabase();
  const counts: Record<string, number> = {};

  const byCourseId = await supabase
    .from("registrations")
    .select("course_id, status")
    .in("course_id", courseIds)
    .eq("status", "paid");

  if (!byCourseId.error) {
    for (const row of byCourseId.data ?? []) {
      if (!row.course_id) continue;
      counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
    }
    return counts;
  }

  const fallback = await supabase
    .from("registrations")
    .select("course_id")
    .in("course_id", courseIds);

  if (!fallback.error) {
    for (const row of fallback.data ?? []) {
      if (!row.course_id) continue;
      counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
    }
    return counts;
  }

  if (byCourseId.error.code !== "42703" && !byCourseId.error.message.includes("status")) {
    console.error("Failed to fetch enrollment counts:", byCourseId.error.message);
    return counts;
  }

  const bySlug = await supabase
    .from("registrations")
    .select("course_slug")
    .in("course_slug", courseIds);

  if (bySlug.error) {
    console.error("Failed to fetch enrollment counts by slug:", bySlug.error.message);
    return counts;
  }

  for (const row of bySlug.data ?? []) {
    if (!row.course_slug) continue;
    counts[row.course_slug] = (counts[row.course_slug] ?? 0) + 1;
  }

  return counts;
}

export async function usesLegacyCourseSchema(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await getSupabase();
  const { data } = await supabase.from("courses").select("*").limit(1).maybeSingle();

  return isLegacyCourseSchema(data ?? undefined);
}
