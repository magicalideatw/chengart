import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  ADMIN_REGISTRATIONS_SELECT,
  groupAdminRegistrations,
  type RegistrationJoinRow,
} from "@/lib/admin/registrations-mappers";
import type { AdminOrderRegistration } from "@/lib/admin/types";
import { mapCourseRow } from "@/lib/courses/mappers";
import { getEnrollmentCountsByCourseIds } from "@/lib/courses/queries";
import type { RegistrationOrderFormData } from "@/lib/registration/types";
import type { PaymentMethod, PaymentStatus } from "@/lib/payment/types";
import { isPaymentMethod } from "@/lib/payment/types";
import { createPaymentClient, isSupabaseConfigured } from "@/lib/supabase";

export type OrderExportMeta = {
  merchantTradeNo: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  transferReported: boolean;
};

export type RegistrationExportSource = {
  registrations: AdminOrderRegistration[];
  orders: Record<string, OrderExportMeta>;
  courseTitle: string;
  courseSessionDate: string;
};

function parsePaymentStatus(value: unknown): PaymentStatus {
  if (
    value === "pending" ||
    value === "waiting_transfer" ||
    value === "paid" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return "pending";
}

export async function fetchRegistrationExportSource(
  courseId?: string,
): Promise<
  | { success: true; data: RegistrationExportSource }
  | { success: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定" };
  }

  await getAuthenticatedUser();

  const supabase = createPaymentClient();

  let query = supabase
    .from("registrations")
    .select(ADMIN_REGISTRATIONS_SELECT)
    .order("created_at", { ascending: false });

  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data: registrationRows, error: registrationError } = await query;

  if (registrationError) {
    return { success: false, error: registrationError.message };
  }

  const rows = (registrationRows ?? []) as RegistrationJoinRow[];

  const [coursesResult, ordersResult] = await Promise.all([
    supabase.from("courses").select("*"),
    supabase
      .from("orders")
      .select(
        "id, merchant_trade_no, payment_method, payment_status, transfer_reported, amount, form_data",
      ),
  ]);

  if (coursesResult.error) {
    return { success: false, error: coursesResult.error.message };
  }

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
  const orders: Record<string, OrderExportMeta> = {};

  for (const order of ordersResult.data ?? []) {
    const orderId = String(order.id);
    const paymentMethod =
      typeof order.payment_method === "string" &&
      isPaymentMethod(order.payment_method)
        ? order.payment_method
        : null;

    orderMap.set(orderId, {
      amount: typeof order.amount === "number" ? order.amount : null,
      formData: (order.form_data as RegistrationOrderFormData) ?? null,
    });

    orders[orderId] = {
      merchantTradeNo: String(order.merchant_trade_no ?? ""),
      paymentMethod,
      paymentStatus: parsePaymentStatus(order.payment_status),
      transferReported: Boolean(order.transfer_reported),
    };
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

  const course = courseId ? courseMap.get(courseId) : undefined;

  return {
    success: true,
    data: {
      registrations,
      orders,
      courseTitle: course?.title ?? "全部活動報名",
      courseSessionDate: course?.sessionDate ?? "",
    },
  };
}
