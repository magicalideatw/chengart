export const DISCOUNT_TYPES = ["fixed", "percent"] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type PricingLineKey = "subtotal" | "early_bird" | "group" | "promo";

export type PricingLineItem = {
  key: PricingLineKey;
  label: string;
  amount: number;
};

export type PricingSnapshot = {
  basePricePerStudent: number;
  studentCount: number;
  /** Total billable session slots (equals studentCount when not session-based). */
  sessionSlotCount: number;
  subtotal: number;
  lines: PricingLineItem[];
  discountTotal: number;
  total: number;
  promoCode: string | null;
  promoCodeId: string | null;
  promoCodeName: string | null;
  isFreeCourse: boolean;
};

export type CoursePricingRules = {
  pricePerStudent: number;
  fee?: number;
  earlyBirdEnabled: boolean;
  earlyBirdDeadline: string | null;
  earlyBirdDiscountType: DiscountType | null;
  earlyBirdDiscountValue: number;
  groupDiscountEnabled: boolean;
  groupDiscountMinStudents: number | null;
  groupDiscountType: DiscountType | null;
  groupDiscountValue: number;
};

export type PromoCodeRecord = {
  id: string;
  courseId: string;
  name: string;
  code: string;
  validFrom: string | null;
  validUntil: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerPerson: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const EMPTY_PRICING_SNAPSHOT: PricingSnapshot = {
  basePricePerStudent: 0,
  studentCount: 0,
  sessionSlotCount: 0,
  subtotal: 0,
  lines: [],
  discountTotal: 0,
  total: 0,
  promoCode: null,
  promoCodeId: null,
  promoCodeName: null,
  isFreeCourse: true,
};
