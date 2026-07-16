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
import { createPaymentClient, isSupabaseConfigured } from "@/lib/supabase";

export async function fetchAdminRegistrations(): Promise<{
  registrations: AdminRegistration[];
  canMutate: boolean;
  error?: string;
}> {
  console.log("[admin/registrations] fetchAdminRegistrations:start");

  if (!isSupabaseConfigured()) {
    console.log("[admin/registrations] fetchAdminRegistrations:supabase-not-configured");
    return {
      registrations: [],
      canMutate: false,
      error: "Supabase 尚未設定，請檢查 .env.local",
    };
  }

  const user = await getAuthenticatedUser();
  const supabase = createPaymentClient();
  const clientMode = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ? "service_role"
    : "anon";

  console.log(
    `[admin/registrations] fetchAdminRegistrations:client mode=${clientMode} authenticatedUser=${Boolean(user)}`,
  );

  const primaryQuery = "registrations.select(ADMIN_REGISTRATIONS_SELECT)";
  console.log(`[admin/registrations] fetchAdminRegistrations:query ${primaryQuery}`);

  const primaryResult = await supabase
    .from("registrations")
    .select(ADMIN_REGISTRATIONS_SELECT)
    .order("created_at", { ascending: false });

  const primaryRowCount = primaryResult.data?.length ?? 0;
  console.log(
    `[admin/registrations] fetchAdminRegistrations:primaryResult error=${primaryResult.error?.message ?? "null"} rowCount=${primaryRowCount}`,
  );

  let rows: RegistrationJoinRow[];
  let queryUsed = primaryQuery;

  const primaryRows = primaryResult.data ?? [];

  if (primaryResult.error || primaryRows.length === 0) {
    if (primaryResult.error) {
      console.error(
        `[admin/registrations] fetchAdminRegistrations:primaryError ${primaryResult.error.message}`,
      );
    } else {
      console.warn(
        "[admin/registrations] fetchAdminRegistrations:primaryEmptyRows",
      );
    }

    queryUsed = "registrations.select(*)";
    console.log(`[admin/registrations] fetchAdminRegistrations:query ${queryUsed}`);

    const fallbackResult = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    const fallbackRowCount = fallbackResult.data?.length ?? 0;
    console.log(
      `[admin/registrations] fetchAdminRegistrations:fallbackResult error=${fallbackResult.error?.message ?? "null"} rowCount=${fallbackRowCount}`,
    );

    if (fallbackResult.error) {
      return {
        registrations: [],
        canMutate: Boolean(user),
        error: fallbackResult.error.message,
      };
    }

    rows = (fallbackResult.data ?? []) as RegistrationJoinRow[];
  } else {
    rows = primaryRows as RegistrationJoinRow[];
  }

  console.log(
    `[admin/registrations] fetchAdminRegistrations:rowsAfterQuery queryUsed=${queryUsed} rowCount=${rows.length}`,
  );

  const [coursesResult, ordersResult] = await Promise.all([
    supabase.from("courses").select("*"),
    supabase.from("orders").select("id, amount, form_data"),
  ]);

  console.log(
    `[admin/registrations] fetchAdminRegistrations:relatedQueries coursesError=${coursesResult.error?.message ?? "null"} coursesCount=${coursesResult.data?.length ?? 0} ordersError=${ordersResult.error?.message ?? "null"} ordersCount=${ordersResult.data?.length ?? 0}`,
  );

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

  console.log(
    `[admin/registrations] fetchAdminRegistrations:mapped inputRowCount=${rows.length} mappedCount=${registrations.length}`,
  );

  console.log("[fetchRegistrations] registrations =", registrations.length);
  console.log(registrations[0]);
  console.log(
    registrations.map((r) => ({
      id: r.id,
      parent: r.name,
      email: r.email,
      created: r.created_at,
      order: r.order_id,
      status: r.status,
    })),
  );

  return {
    registrations,
    canMutate: Boolean(user),
  };
}
