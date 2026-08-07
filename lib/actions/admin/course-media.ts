"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AdminActionResult } from "@/lib/admin/types";
import {
  deleteCourseMedia,
  getCourseMediaByCourseId,
  saveCourseMedia,
} from "@/lib/media/queries";
import { courseMediaSchema } from "@/lib/validation/course-media-schema";

export async function saveCourseMediaAction(input: {
  id?: string;
  courseId: string;
  mediaType: "youtube";
  title: string;
  sourceUrl: string;
  sortOrder: number;
  isVisible: boolean;
}): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const parsed = courseMediaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const result = await saveCourseMedia(parsed.data);
  if (!result.success) {
    return { success: false, error: result.error ?? "儲存失敗" };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${input.courseId}`);
  return { success: true };
}

export async function deleteCourseMediaAction(
  mediaId: string,
  courseId: string,
): Promise<AdminActionResult> {
  await requireAuthenticatedUser();

  const result = await deleteCourseMedia(mediaId);
  if (!result.success) {
    return { success: false, error: result.error ?? "刪除失敗" };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}

export async function getCourseMediaForCourseAction(courseId: string) {
  await requireAuthenticatedUser();
  return getCourseMediaByCourseId(courseId);
}
