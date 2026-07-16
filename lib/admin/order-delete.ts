import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  formatSupabaseError,
  logDeleteStep,
  mutationError,
  type MutationResult,
} from "@/lib/admin/delete-utils";

type Supabase = SupabaseClient<Database>;

const SCOPE = "deleteOrdersCascade";

export type DeleteOrdersResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

async function deleteByOrderIds(
  supabase: Supabase,
  table: "order_email_logs" | "promo_code_redemptions" | "students",
  step: string,
  orderIds: string[],
  scope: string,
): Promise<MutationResult> {
  if (orderIds.length === 0) {
    logDeleteStep(scope, step, "ok");
    return { success: true };
  }

  logDeleteStep(scope, step, "start");
  const { error } = await supabase.from(table).delete().in("order_id", orderIds);
  if (error) {
    return mutationError(scope, step, `刪除 ${table} 失敗`, error);
  }

  logDeleteStep(scope, step, "ok");
  return { success: true };
}

/**
 * Deletes orders and dependent rows in FK-safe order.
 * order_email_logs → promo_code_redemptions → students → orders
 */
export async function deleteOrdersCascade(
  supabase: Supabase,
  orderIds: string[],
  options?: { scope?: string },
): Promise<DeleteOrdersResult> {
  const scope = options?.scope ?? SCOPE;
  const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];

  if (uniqueOrderIds.length === 0) {
    console.log(`[${scope}] No orders to delete`);
    return { success: true, deletedCount: 0 };
  }

  console.log(`[${scope}] Deleting ${uniqueOrderIds.length} order(s)`);

  const emailLogsResult = await deleteByOrderIds(
    supabase,
    "order_email_logs",
    "Deleting Order Email Logs",
    uniqueOrderIds,
    scope,
  );
  if (!emailLogsResult.success) {
    return { success: false, error: emailLogsResult.error };
  }

  const redemptionsResult = await deleteByOrderIds(
    supabase,
    "promo_code_redemptions",
    "Deleting Promo Code Redemptions",
    uniqueOrderIds,
    scope,
  );
  if (!redemptionsResult.success) {
    return { success: false, error: redemptionsResult.error };
  }

  const studentsResult = await deleteByOrderIds(
    supabase,
    "students",
    "Deleting Students",
    uniqueOrderIds,
    scope,
  );
  if (!studentsResult.success) {
    return { success: false, error: studentsResult.error };
  }

  logDeleteStep(scope, "Deleting Orders", "start");
  const { data: deletedRows, error: ordersError } = await supabase
    .from("orders")
    .delete()
    .in("id", uniqueOrderIds)
    .select("id");

  console.log(`[${scope}] Deleted Orders:`, deletedRows?.length ?? 0, deletedRows);

  if (ordersError) {
    const failed = mutationError(scope, "Deleting Orders", "刪除訂單失敗", ordersError);
    return { success: false, error: failed.error };
  }

  const deletedCount = deletedRows?.length ?? 0;
  if (deletedCount !== uniqueOrderIds.length) {
    const { count: remainingCount, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("id", uniqueOrderIds);

    const remaining = countError ? "unknown" : String(remainingCount ?? 0);
    const message = `刪除訂單失敗：預期刪除 ${uniqueOrderIds.length} 筆，實際刪除 ${deletedCount} 筆，仍剩 ${remaining} 筆。可能是 RLS 未允許 DELETE（請執行 035_orders_delete_rls.sql）`;
    logDeleteStep(scope, "Deleting Orders", "fail", message);
    return { success: false, error: message };
  }

  logDeleteStep(scope, "Deleting Orders", "ok");
  return { success: true, deletedCount };
}

export async function deleteOrdersByCourseId(
  supabase: Supabase,
  courseId: string,
  options?: { scope?: string },
): Promise<DeleteOrdersResult> {
  const scope = options?.scope ?? "deleteActivityCascade";

  logDeleteStep(scope, "Loading Orders", "start");
  const { data: orderRows, error: queryError } = await supabase
    .from("orders")
    .select("id")
    .eq("course_id", courseId);

  if (queryError) {
    const failed = mutationError(scope, "Loading Orders", "讀取訂單資料失敗", queryError);
    return { success: false, error: failed.error };
  }

  const orderIds = (orderRows ?? []).map((row) => String(row.id));
  logDeleteStep(scope, "Loading Orders", "ok");
  console.log(`[${scope}] Order count: ${orderIds.length}`);

  return deleteOrdersCascade(supabase, orderIds, { scope });
}

export { formatSupabaseError };
