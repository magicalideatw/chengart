import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  ADMIN_REGISTRATIONS_SELECT,
  groupAdminRegistrations,
  type RegistrationJoinRow,
} from "@/lib/admin/registrations-mappers";
import type { AdminRegistration } from "@/lib/admin/types";
import { mapCourseRow } from "@/lib/courses/mappers";
import { getEnrollmentCountsByCourseIds } from "@/lib/courses/queries";
import type { RegistrationOrderFormData } from "@/lib/registration/types";
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

  const primaryResult = await supabase
    .from("registrations")
    .select(ADMIN_REGISTRATIONS_SELECT)
    .order("created_at", { ascending: false });

  let rows: RegistrationJoinRow[];

  if (primaryResult.error) {
    const fallbackResult = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (fallbackResult.error) {
      return {
        registrations: [],
        canMutate: Boolean(user),
        error: fallbackResult.error.message,
      };
    }

    rows = (fallbackResult.data ?? []) as RegistrationJoinRow[];
  } else {
    rows = (primaryResult.data ?? []) as RegistrationJoinRow[];
  }

  const [coursesResult, ordersResult] = await Promise.all([
    supabase.from("courses").select("*"),
    supabase.from("orders").select("id, amount, form_data"),
  ]);

  const courseMap = new Map<string, ReturnType<typeof mapCourseRow>>();

  for (const row of coursesResult.data ?? []) {
    const course = mapCourseRow(row);
    courseMap.set(course.id, course);

    if ("slug" in row && typeof row.slug === "string") {
      courseMap.set(row.slug, course);
    }
  }

  const orderMap = new Map<
    string,
    { amount: number | null; formData: RegistrationOrderFormData | null }
  >();

  for (const order of ordersResult.data ?? []) {
    orderMap.set(String(order.id), {
      amount: typeof order.amount === "number" ? order.amount : null,
      formData: (order.form_data as RegistrationOrderFormData) ?? null,
    });
  }

  const courseIds = rows
    .map((row) => row.course_id ?? row.course_slug)
    .filter((value): value is string => Boolean(value));

  const slotCounts = await getEnrollmentCountsByCourseIds(courseIds);

  const registrations = groupAdminRegistrations(
    rows,
    courseMap,
    slotCounts,
    orderMap,
  );

  return {
    registrations,
    canMutate: Boolean(user),
  };
}
