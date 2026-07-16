import { z } from "zod";
import { ACTIVITY_DELETE_CONFIRMATION } from "@/lib/validation/activity-delete-schema";

export const bulkDeleteConfirmationSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === ACTIVITY_DELETE_CONFIRMATION, {
      message: `請輸入 ${ACTIVITY_DELETE_CONFIRMATION} 以確認刪除`,
    }),
});

export const deletePerformanceOrdersSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, "請至少選擇一筆訂單"),
});

export { ACTIVITY_DELETE_CONFIRMATION as BULK_DELETE_CONFIRMATION };
