import { isPerformanceOrderFormData } from "@/lib/orders/order-form-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  formatSupabaseError,
  logDeleteStep,
  mutationError,
  type PostgrestErrorLike,
} from "@/lib/admin/delete-utils";
import { deleteOrdersCascade } from "@/lib/admin/order-delete";

type MutationResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

type Supabase = SupabaseClient<Database>;

const SCOPE = "deletePerformanceOrders";

const NULL_UUID = "00000000-0000-0000-0000-000000000000";

async function cleanupStudentsWithoutRegistrations(
  supabase: Supabase,
  orderIds: string[],
): Promise<MutationResult> {
  for (const orderId of orderIds) {
    logDeleteStep(SCOPE, `Checking Registrations for order ${orderId}`, "start");
    const { count, error: countError } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId);

    if (countError) {
      const failed = mutationError(SCOPE, "Checking Registrations", "檢查報名資料失敗", countError);
      return { success: false, error: failed.error };
    }

    if ((count ?? 0) > 0) {
      logDeleteStep(SCOPE, `Checking Registrations for order ${orderId}`, "ok");
      continue;
    }

    logDeleteStep(SCOPE, "Deleting Orphan Students", "start");
    const { error } = await supabase.from("students").delete().eq("order_id", orderId);
    if (error) {
      const failed = mutationError(SCOPE, "Deleting Orphan Students", "刪除學生資料失敗", error);
      return { success: false, error: failed.error };
    }
    logDeleteStep(SCOPE, "Deleting Orphan Students", "ok");
  }

  return { success: true, deletedCount: 0 };
}

export async function clearAllRegistrations(
  supabase: Supabase,
): Promise<MutationResult> {
  logDeleteStep(SCOPE, "Loading Registrations", "start");
  const { data: registrationRows, error: queryError } = await supabase
    .from("registrations")
    .select("id, order_id");

  if (queryError) {
    const failed = mutationError(SCOPE, "Loading Registrations", "讀取報名資料失敗", queryError);
    return { success: false, error: failed.error };
  }
  logDeleteStep(SCOPE, "Loading Registrations", "ok");

  const registrationIds = (registrationRows ?? []).map((row) => String(row.id));
  const orderIds = [
    ...new Set(
      (registrationRows ?? [])
        .map((row) => (row.order_id ? String(row.order_id) : null))
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  if (registrationIds.length > 0) {
    logDeleteStep(SCOPE, "Deleting Attendance", "start");
    const { error: attendanceError } = await supabase
      .from("attendance")
      .delete()
      .in("registration_id", registrationIds);

    if (attendanceError) {
      const failed = mutationError(SCOPE, "Deleting Attendance", "刪除出席紀錄失敗", attendanceError);
      return { success: false, error: failed.error };
    }
    logDeleteStep(SCOPE, "Deleting Attendance", "ok");

    logDeleteStep(SCOPE, "Deleting Registrations", "start");
    const { error } = await supabase
      .from("registrations")
      .delete()
      .in("id", registrationIds);

    if (error) {
      const failed = mutationError(SCOPE, "Deleting Registrations", "清空報名資料失敗", error);
      return { success: false, error: failed.error };
    }
    logDeleteStep(SCOPE, "Deleting Registrations", "ok");
  }

  const cleanupResult = await cleanupStudentsWithoutRegistrations(supabase, orderIds);
  if (!cleanupResult.success) return cleanupResult;

  return { success: true, deletedCount: registrationIds.length };
}

export async function deletePerformanceOrdersByIds(
  supabase: Supabase,
  orderIds: string[],
): Promise<MutationResult> {
  const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];
  if (uniqueOrderIds.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  logDeleteStep(SCOPE, "Loading Orders", "start");
  const { data: orderRows, error: queryError } = await supabase
    .from("orders")
    .select("id, form_data")
    .in("id", uniqueOrderIds);

  if (queryError) {
    const failed = mutationError(SCOPE, "Loading Orders", "讀取訂單資料失敗", queryError);
    return { success: false, error: failed.error };
  }
  logDeleteStep(SCOPE, "Loading Orders", "ok");

  const performanceOrderIds = (orderRows ?? [])
    .filter((row) =>
      isPerformanceOrderFormData(
        (row.form_data ?? {}) as Record<string, unknown>,
      ),
    )
    .map((row) => String(row.id));

  console.log(
    `[${SCOPE}] Performance order count: ${performanceOrderIds.length} / requested ${uniqueOrderIds.length}`,
  );

  if (performanceOrderIds.length === 0) {
    return { success: false, error: "找不到可刪除的演出購票訂單" };
  }

  const deleteResult = await deleteOrdersCascade(supabase, performanceOrderIds, {
    scope: SCOPE,
  });

  if (!deleteResult.success) {
    return { success: false, error: deleteResult.error };
  }

  return { success: true, deletedCount: deleteResult.deletedCount };
}

export async function clearAllPerformanceOrders(
  supabase: Supabase,
  performanceCourseIds: ReadonlySet<string>,
): Promise<MutationResult> {
  logDeleteStep(SCOPE, "Loading All Orders", "start");
  const { data: orderRows, error: queryError } = await supabase
    .from("orders")
    .select("id, course_id, form_data");

  if (queryError) {
    const failed = mutationError(SCOPE, "Loading All Orders", "讀取訂單資料失敗", queryError);
    return { success: false, error: failed.error };
  }
  logDeleteStep(SCOPE, "Loading All Orders", "ok");

  const performanceOrderIds = (orderRows ?? [])
    .filter((row) => {
      if (
        isPerformanceOrderFormData(
          (row.form_data ?? {}) as Record<string, unknown>,
        )
      ) {
        return true;
      }

      return Boolean(
        row.course_id && performanceCourseIds.has(String(row.course_id)),
      );
    })
    .map((row) => String(row.id));

  return deletePerformanceOrdersByIds(supabase, performanceOrderIds);
}

export async function countAllRegistrations(supabase: Supabase): Promise<number> {
  const { count, error } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .neq("id", NULL_UUID);

  if (error) {
    console.error(`[${SCOPE}] Count registrations failed:`, formatSupabaseError(error));
    return 0;
  }

  return count ?? 0;
}

export async function countAllPerformanceOrders(
  supabase: Supabase,
  performanceCourseIds: ReadonlySet<string>,
): Promise<number> {
  const { data, error } = await supabase.from("orders").select("id, course_id, form_data");

  if (error) {
    console.error(`[${SCOPE}] Count performance orders failed:`, formatSupabaseError(error));
    return 0;
  }

  return (data ?? []).filter((row) => {
    if (
      isPerformanceOrderFormData((row.form_data ?? {}) as Record<string, unknown>)
    ) {
      return true;
    }

    return Boolean(row.course_id && performanceCourseIds.has(String(row.course_id)));
  }).length;
}

export { formatSupabaseError, type PostgrestErrorLike };
