"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import {
  deleteCoursePlan,
  getCoursePlansByCourseId,
  saveCoursePlan,
} from "@/lib/course-plans/queries";
import { coursePlanSchema } from "@/lib/validation/course-plan-schema";

export async function getCoursePlansForCourseAction(courseId: string) {
  await requireAuthenticatedUser();
  return getCoursePlansByCourseId(courseId);
}

export async function saveCoursePlanAction(input: {
  id?: string;
  courseId: string;
  name: string;
  sessionCount: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = coursePlanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const result = await saveCoursePlan({
    id: input.id,
    courseId: input.courseId,
    values: parsed.data,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${input.courseId}`);
  return { success: true };
}

export async function deleteCoursePlanAction(
  planId: string,
  courseId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const result = await deleteCoursePlan(planId, courseId);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}
