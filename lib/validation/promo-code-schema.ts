import { z } from "zod";
import { DISCOUNT_TYPES } from "@/lib/pricing/types";

export const promoCodeSchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().min(1),
  name: z.string().min(1, "請填寫名稱"),
  code: z.string().min(1, "請填寫 Code"),
  validFrom: z.string().optional().default(""),
  validUntil: z.string().optional().default(""),
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.coerce.number().int().min(0, "折扣值不可為負數"),
  maxUses: z
    .union([z.coerce.number().int().min(1), z.null()])
    .optional()
    .transform((value) => value ?? null),
  maxUsesPerPerson: z
    .union([z.coerce.number().int().min(1), z.null()])
    .optional()
    .transform((value) => value ?? null),
  isActive: z.boolean(),
});
