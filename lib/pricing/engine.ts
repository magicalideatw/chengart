import { isBeforeRegistrationDeadline } from "@/lib/courses/enrollment";
import type {
  CoursePricingRules,
  DiscountType,
  PricingLineItem,
  PricingSnapshot,
  PromoCodeRecord,
} from "@/lib/pricing/types";
import { getEffectivePricePerStudent } from "@/lib/registration/pricing";

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isEarlyBirdActive(course: CoursePricingRules): boolean {
  if (!course.earlyBirdEnabled || !course.earlyBirdDeadline) return false;

  return isBeforeRegistrationDeadline({
    registrationDeadline: course.earlyBirdDeadline,
  });
}

function computeDiscountAmount(
  currentTotal: number,
  type: DiscountType,
  value: number,
): number {
  if (currentTotal <= 0 || value <= 0) return 0;

  if (type === "percent") {
    return Math.min(currentTotal, Math.round((currentTotal * value) / 100));
  }

  return Math.min(currentTotal, value);
}

function formatDiscountLabel(
  prefix: string,
  type: DiscountType,
  value: number,
): string {
  if (type === "percent") {
    return `${prefix}（${value}%）`;
  }
  return `${prefix}（NT$ ${value.toLocaleString()}）`;
}

export function courseToPricingRules(
  course: Partial<CoursePricingRules> & {
    pricePerStudent?: number;
    fee?: number;
  },
): CoursePricingRules {
  return {
    pricePerStudent: course.pricePerStudent ?? course.fee ?? 0,
    fee: course.fee,
    earlyBirdEnabled: course.earlyBirdEnabled ?? false,
    earlyBirdDeadline: course.earlyBirdDeadline ?? null,
    earlyBirdDiscountType: course.earlyBirdDiscountType ?? null,
    earlyBirdDiscountValue: course.earlyBirdDiscountValue ?? 0,
    groupDiscountEnabled: course.groupDiscountEnabled ?? false,
    groupDiscountMinStudents: course.groupDiscountMinStudents ?? null,
    groupDiscountType: course.groupDiscountType ?? null,
    groupDiscountValue: course.groupDiscountValue ?? 0,
  };
}

export function calculateRegistrationPricing(input: {
  course: CoursePricingRules;
  studentCount: number;
  sessionSlotCount?: number;
  promoCode?: PromoCodeRecord | null;
  asOf?: Date;
  /** Package price per student (e.g. self-scheduled course plan). */
  packagePricePerStudent?: number;
}): PricingSnapshot {
  const count = Math.max(input.studentCount, 0);
  const slotCount = Math.max(input.sessionSlotCount ?? count, 0);
  const basePricePerStudent = getEffectivePricePerStudent(input.course);
  const packagePrice = input.packagePricePerStudent;

  if ((packagePrice == null && basePricePerStudent <= 0) || count === 0 || slotCount === 0) {
    return {
      basePricePerStudent,
      studentCount: count,
      sessionSlotCount: slotCount,
      subtotal: 0,
      lines: [],
      discountTotal: 0,
      total: 0,
      promoCode: input.promoCode?.code ?? null,
      promoCodeId: input.promoCode?.id ?? null,
      promoCodeName: input.promoCode?.name ?? null,
      isFreeCourse: basePricePerStudent <= 0,
    };
  }

  const effectiveUnitPrice = packagePrice ?? basePricePerStudent;
  const subtotal =
    packagePrice != null ? packagePrice * count : basePricePerStudent * slotCount;
  const lines: PricingLineItem[] = [
    { key: "subtotal", label: "原價", amount: subtotal },
  ];

  let runningTotal = subtotal;
  let discountTotal = 0;

  const course = input.course;

  if (
    isEarlyBirdActive(course) &&
    course.earlyBirdDiscountType &&
    course.earlyBirdDiscountValue > 0
  ) {
    const amount = computeDiscountAmount(
      runningTotal,
      course.earlyBirdDiscountType,
      course.earlyBirdDiscountValue,
    );

    if (amount > 0) {
      lines.push({
        key: "early_bird",
        label: formatDiscountLabel(
          "早鳥",
          course.earlyBirdDiscountType,
          course.earlyBirdDiscountValue,
        ),
        amount: -amount,
      });
      discountTotal += amount;
      runningTotal -= amount;
    }
  }

  if (
    course.groupDiscountEnabled &&
    course.groupDiscountMinStudents &&
    count >= course.groupDiscountMinStudents &&
    course.groupDiscountType &&
    course.groupDiscountValue > 0
  ) {
    const amount = computeDiscountAmount(
      runningTotal,
      course.groupDiscountType,
      course.groupDiscountValue,
    );

    if (amount > 0) {
      lines.push({
        key: "group",
        label: formatDiscountLabel(
          "團報",
          course.groupDiscountType,
          course.groupDiscountValue,
        ),
        amount: -amount,
      });
      discountTotal += amount;
      runningTotal -= amount;
    }
  }

  const promo = input.promoCode;
  if (promo && promo.discountValue > 0) {
    const amount = computeDiscountAmount(
      runningTotal,
      promo.discountType,
      promo.discountValue,
    );

    if (amount > 0) {
      lines.push({
        key: "promo",
        label: formatDiscountLabel(`折扣碼 ${promo.code}`, promo.discountType, promo.discountValue),
        amount: -amount,
      });
      discountTotal += amount;
      runningTotal -= amount;
    }
  }

  return {
    basePricePerStudent: effectiveUnitPrice,
    studentCount: count,
    sessionSlotCount: slotCount,
    subtotal,
    lines,
    discountTotal,
    total: Math.max(runningTotal, 0),
    promoCode: promo?.code ?? null,
    promoCodeId: promo?.id ?? null,
    promoCodeName: promo?.name ?? null,
    isFreeCourse: effectiveUnitPrice <= 0,
  };
}

export function isPromoCodeDateValid(
  promo: Pick<PromoCodeRecord, "validFrom" | "validUntil">,
): boolean {
  const today = todayIsoDate();

  if (promo.validFrom && today < promo.validFrom) {
    return false;
  }

  if (promo.validUntil && today > promo.validUntil) {
    return false;
  }

  return true;
}

export function parsePricingSnapshot(value: unknown): PricingSnapshot | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const lines = Array.isArray(record.lines)
    ? record.lines
        .filter((line) => line && typeof line === "object")
        .map((line) => {
          const item = line as Record<string, unknown>;
          return {
            key: item.key as PricingLineItem["key"],
            label: String(item.label ?? ""),
            amount: Number(item.amount ?? 0),
          };
        })
    : [];

  const studentCount = Number(record.studentCount ?? 0);

  return {
    basePricePerStudent: Number(record.basePricePerStudent ?? 0),
    studentCount,
    sessionSlotCount: Number(record.sessionSlotCount ?? studentCount),
    subtotal: Number(record.subtotal ?? 0),
    lines,
    discountTotal: Number(record.discountTotal ?? 0),
    total: Number(record.total ?? 0),
    promoCode: record.promoCode ? String(record.promoCode) : null,
    promoCodeId: record.promoCodeId ? String(record.promoCodeId) : null,
    promoCodeName: record.promoCodeName ? String(record.promoCodeName) : null,
    isFreeCourse: Boolean(record.isFreeCourse),
  };
}

export function formatPricingDiscountSummary(snapshot: PricingSnapshot): string {
  const discounts = snapshot.lines.filter((line) => line.amount < 0);
  if (discounts.length === 0) return "—";

  return discounts.map((line) => line.label).join("、");
}
