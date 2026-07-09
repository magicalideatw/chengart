import { getAuthenticatedUser } from "@/lib/auth/session";
import { mapCourseRow } from "@/lib/courses/mappers";
import { getEnrollmentCountsByCourseIds } from "@/lib/courses/queries";
import type { AdminRegistration } from "@/lib/admin/types";
import { DEFAULT_MAX_CAPACITY } from "@/lib/registrations/availability";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function fetchAdminRegistrations(): Promise<{
  registrations: AdminRegistration[];
  canMutate: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      registrations: [],
      canMutate: false,
      error: "Supabase 尚未設定，請檢查 .env.local",
    };
  }

  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const registrationsResult = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (registrationsResult.error) {
    return {
      registrations: [],
      canMutate: Boolean(user),
      error: registrationsResult.error.message,
    };
  }

  const coursesResult = await supabase.from("courses").select("*");
  const courseMap = new Map<string, ReturnType<typeof mapCourseRow>>();

  for (const row of coursesResult.data ?? []) {
    const course = mapCourseRow(row);
    courseMap.set(course.id, course);

    if ("slug" in row && typeof row.slug === "string") {
      courseMap.set(row.slug, course);
    }
  }

  const rows = registrationsResult.data ?? [];
  const courseIds = rows
    .map((row) => row.course_id ?? row.course_slug)
    .filter((value): value is string => Boolean(value));

  const slotCounts = await getEnrollmentCountsByCourseIds(courseIds);

  const registrations: AdminRegistration[] = rows.map((row) => {
    const lookupKey = row.course_id ?? row.course_slug ?? "";
    const course = courseMap.get(lookupKey);
    const maxCapacity = course?.capacity ?? DEFAULT_MAX_CAPACITY;

    return {
      id: row.id,
      course_id: row.course_id ?? row.course_slug ?? "",
      status: (row.status as AdminRegistration["status"] | undefined) ?? "paid",
      name: row.name ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      student_name: row.student_name ?? "",
      student_age: row.student_age ?? "",
      is_first_time: row.is_first_time ?? false,
      note: row.note,
      created_at: row.created_at ?? new Date().toISOString(),
      courseTitle: course?.title ?? "未知課程",
      courseCategory: course?.category ?? "",
      sessionDate: course?.sessionDate ?? row.session_date ?? "",
      sessionTime: course?.sessionTime ?? row.class_time ?? "—",
      slotEnrollment: slotCounts[lookupKey] ?? 0,
      maxCapacity,
    };
  });

  return {
    registrations,
    canMutate: Boolean(user),
  };
}
