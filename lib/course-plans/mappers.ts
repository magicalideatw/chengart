import type { Database } from "@/lib/supabase/database.types";
import type { CoursePlan, CoursePlanFormInput } from "@/lib/course-plans/types";

type CoursePlanRow = Database["public"]["Tables"]["course_plans"]["Row"];

export function mapCoursePlanRow(row: Record<string, unknown>): CoursePlan {
  const item = row as CoursePlanRow;

  return {
    id: String(item.id),
    courseId: String(item.course_id),
    name: String(item.name ?? ""),
    sessionCount: Number(item.session_count ?? 1),
    price: Number(item.price ?? 0),
    sortOrder: Number(item.sort_order ?? 0),
    isActive: Boolean(item.is_active ?? true),
    createdAt: String(item.created_at),
    updatedAt: String(item.updated_at),
  };
}

export function mapCoursePlanToDb(
  courseId: string,
  input: CoursePlanFormInput,
): Database["public"]["Tables"]["course_plans"]["Insert"] {
  return {
    course_id: courseId,
    name: input.name.trim(),
    session_count: input.sessionCount,
    price: input.price,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };
}

export function coursePlanToFormInput(plan: CoursePlan): CoursePlanFormInput {
  return {
    name: plan.name,
    sessionCount: plan.sessionCount,
    price: plan.price,
    sortOrder: plan.sortOrder,
    isActive: plan.isActive,
  };
}

export function formatCoursePlanLabel(plan: Pick<CoursePlan, "name" | "sessionCount">): string {
  const name = plan.name.trim() || "課程方案";
  return `${name}（${plan.sessionCount}堂）`;
}
