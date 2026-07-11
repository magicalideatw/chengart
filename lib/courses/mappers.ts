import type { Database } from "@/lib/supabase/database.types";
import type { Course, CourseListing, CourseWithEnrollment } from "@/lib/courses/types";
import type { PaymentMethod } from "@/lib/payment/types";
import { parsePaymentMethods } from "@/lib/payment/types";

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

function mapLegacyCourseRow(row: LegacyCourseRow): Course {
  return {
    id: row.slug,
    title: row.title ?? "",
    category: LEGACY_CATEGORY_MAP[row.slug] ?? "其他",
    description: row.subtitle ?? "",
    sessionDate: "",
    sessionTime: "—",
    capacity: row.max_capacity_per_class ?? 5,
    fee: 0,
    coverImage: row.cover_image ?? "",
    isOpen: true,
    allowedPaymentMethods: ["ecpay"],
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
    sessionDate: course.session_date ?? "",
    sessionTime: course.session_time ?? "—",
    capacity: course.capacity ?? 5,
    fee: course.fee ?? 0,
    coverImage: course.cover_image ?? "",
    isOpen: course.is_open ?? false,
    allowedPaymentMethods: parsePaymentMethods(course.allowed_payment_methods),
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
    fee: course.fee,
    href: `/courses/${course.id}`,
    isOpen: course.isOpen,
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

export function mapCourseToDb(input: {
  title: string;
  category: string;
  description: string;
  sessionDate: string;
  sessionTime: string;
  capacity: number;
  fee: number;
  coverImage: string;
  isOpen: boolean;
  allowedPaymentMethods: PaymentMethod[];
}): Database["public"]["Tables"]["courses"]["Insert"] {
  return {
    title: input.title,
    category: input.category,
    description: input.description,
    session_date: input.sessionDate,
    session_time: input.sessionTime,
    capacity: input.capacity,
    fee: input.fee,
    cover_image: input.coverImage,
    is_open: input.isOpen,
    allowed_payment_methods: input.allowedPaymentMethods,
  };
}

export function isLegacyCourseSchema(
  row: Record<string, unknown> | undefined,
): boolean {
  return Boolean(row && isLegacyCourseRow(row));
}
