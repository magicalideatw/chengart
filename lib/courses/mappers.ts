import type { DiscountType } from "@/lib/pricing/types";
import type { Database } from "@/lib/supabase/database.types";
import type { Course, CourseListing, CourseWithEnrollment } from "@/lib/courses/types";
import type { PaymentMethod } from "@/lib/payment/types";
import { parsePaidPaymentMethods } from "@/lib/payment/types";
import { parseRegistrationMode } from "@/lib/courses/registration-mode";
import { parseActivityType } from "@/lib/courses/activity-type";
import {
  parseParticipationMethod,
  resolveActionButtonText,
} from "@/lib/courses/participation-method";
import {
  normalizeCourseCoverStorageValue,
  sanitizeCourseCoverForStorage,
} from "@/lib/courses/cover-image";
import { formatCourseSessionTimeRange } from "@/lib/courses/session-time";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

type LegacyCourseRow = {
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  cover_image: string;
  max_capacity_per_class: number;
  created_at: string;
  updated_at: string;
};

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  dance: "舞蹈",
  magic: "魔術",
  drama: "戲劇",
  camp: "冬夏令營",
};

function isLegacyCourseRow(row: Record<string, unknown>): row is LegacyCourseRow {
  return typeof row.slug === "string" && !("id" in row && row.id);
}

function parseDiscountType(value: unknown): DiscountType | null {
  return value === "fixed" || value === "percent" ? value : null;
}

function mapLegacyCourseRow(row: LegacyCourseRow): Course {
  return {
    id: row.slug,
    title: row.title ?? "",
    category: LEGACY_CATEGORY_MAP[row.slug] ?? "其他",
    description: row.subtitle ?? "",
    courseDetails: "",
    activityType: "course",
    activityRules: "",
    participationMethod: "internal",
    externalUrl: null,
    actionButtonText: "立即報名",
    sessionDate: "",
    sessionTime: "—",
    capacity: row.max_capacity_per_class ?? 5,
    fee: 0,
    coverImage: normalizeCourseCoverStorageValue(row.cover_image),
    isOpen: true,
    allowedPaymentMethods: ["ecpay"],
    registrationMode: "adult",
    pricePerStudent: 0,
    registrationDeadline: null,
    showRemainingCapacity: true,
    transferDeadlineDays: null,
    earlyBirdEnabled: false,
    earlyBirdDeadline: null,
    earlyBirdDiscountType: null,
    earlyBirdDiscountValue: 0,
    groupDiscountEnabled: false,
    groupDiscountMinStudents: null,
    groupDiscountType: null,
    groupDiscountValue: 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export function mapCourseRow(row: Record<string, unknown>): Course {
  if (isLegacyCourseRow(row)) {
    return mapLegacyCourseRow(row);
  }

  const course = row as CourseRow;

  return {
    id: course.id ?? "",
    title: course.title ?? "",
    category: course.category ?? "其他",
    description: course.description ?? "",
    courseDetails: course.course_details ?? "",
    activityType: parseActivityType(course.activity_type),
    activityRules: course.activity_rules ?? "",
    participationMethod: parseParticipationMethod(course.participation_method),
    externalUrl: course.external_url ?? null,
    actionButtonText: resolveActionButtonText(
      course.action_button_text,
      parseActivityType(course.activity_type),
    ),
    sessionDate: course.session_date ?? "",
    sessionTime: course.session_time ?? "—",
    capacity: course.capacity ?? 5,
    fee: course.fee ?? 0,
    coverImage: normalizeCourseCoverStorageValue(course.cover_image),
    isOpen: course.is_open ?? false,
    allowedPaymentMethods: parsePaidPaymentMethods(course.allowed_payment_methods),
    registrationMode: parseRegistrationMode(course.registration_mode),
    pricePerStudent: course.price_per_student ?? course.fee ?? 0,
    registrationDeadline: course.registration_deadline ?? null,
    showRemainingCapacity: course.show_remaining_capacity ?? true,
    transferDeadlineDays: course.transfer_deadline_days ?? null,
    earlyBirdEnabled: course.early_bird_enabled ?? false,
    earlyBirdDeadline: course.early_bird_deadline ?? null,
    earlyBirdDiscountType: parseDiscountType(course.early_bird_discount_type),
    earlyBirdDiscountValue: course.early_bird_discount_value ?? 0,
    groupDiscountEnabled: course.group_discount_enabled ?? false,
    groupDiscountMinStudents: course.group_discount_min_students ?? null,
    groupDiscountType: parseDiscountType(course.group_discount_type),
    groupDiscountValue: course.group_discount_value ?? 0,
    createdAt: course.created_at ?? new Date().toISOString(),
    updatedAt: course.updated_at ?? new Date().toISOString(),
  };
}

export function toCourseListing(course: Course): CourseListing {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    coverImage: course.coverImage,
    fee: course.pricePerStudent || course.fee,
    pricePerStudent: course.pricePerStudent,
    href: `/courses/${course.id}`,
    isOpen: course.isOpen,
    activityType: course.activityType,
    participationMethod: course.participationMethod,
    externalUrl: course.externalUrl,
    actionButtonText: course.actionButtonText,
  };
}

export function withEnrollment(
  course: Course,
  enrollmentCount: number,
): CourseWithEnrollment {
  const capacity = course.capacity > 0 ? course.capacity : 5;

  return {
    ...course,
    capacity,
    enrollmentCount,
    isFull: enrollmentCount >= capacity,
  };
}

export function mapCourseToDb(
  input: import("@/lib/courses/types").CourseFormInput,
): Database["public"]["Tables"]["courses"]["Insert"] {
  const paidMethods: PaymentMethod[] =
    input.pricePerStudent <= 0 ? [] : [...input.allowedPaymentMethods];

  const isSelfScheduled =
    input.activityType === "course" && input.scheduleMode === "self_scheduled";
  const sessionTime = isSelfScheduled
    ? ""
    : formatCourseSessionTimeRange(input.sessionStartTime, input.sessionEndTime) ||
      input.sessionTime.trim();

  return {
    title: input.title,
    category: input.category,
    description: input.description,
    course_details: input.courseDetails.trim(),
    activity_type: input.activityType,
    activity_rules: input.activityRules.trim(),
    participation_method: input.participationMethod,
    external_url:
      input.participationMethod === "external"
        ? input.externalUrl.trim() || null
        : null,
    action_button_text: resolveActionButtonText(
      input.actionButtonText,
      input.activityType,
    ),
    session_date: isSelfScheduled ? "2099-01-01" : input.sessionDate,
    session_time: sessionTime || "—",
    capacity: input.capacity,
    fee: input.pricePerStudent,
    cover_image: sanitizeCourseCoverForStorage(input.coverImage),
    is_open: input.isOpen,
    allowed_payment_methods: paidMethods,
    registration_mode: input.registrationMode,
    price_per_student: input.pricePerStudent,
    registration_deadline: input.registrationDeadline.trim() || null,
    show_remaining_capacity: input.showRemainingCapacity,
    transfer_deadline_days: input.transferDeadlineDays,
    early_bird_enabled: input.earlyBirdEnabled,
    early_bird_deadline: input.earlyBirdDeadline.trim() || null,
    early_bird_discount_type: input.earlyBirdEnabled
      ? input.earlyBirdDiscountType
      : null,
    early_bird_discount_value: input.earlyBirdDiscountValue,
    group_discount_enabled: input.groupDiscountEnabled,
    group_discount_min_students: input.groupDiscountEnabled
      ? input.groupDiscountMinStudents
      : null,
    group_discount_type: input.groupDiscountEnabled
      ? input.groupDiscountType
      : null,
    group_discount_value: input.groupDiscountValue,
  };
}

export function isLegacyCourseSchema(
  row: Record<string, unknown> | undefined,
): boolean {
  return Boolean(row && isLegacyCourseRow(row));
}
