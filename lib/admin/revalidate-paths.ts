import { revalidatePath } from "next/cache";

/** Invalidate admin pages that show enrollment / sold-ticket counts. */
export function revalidateAdminActivityStatsPaths(courseId?: string) {
  revalidatePath("/admin/courses", "page");
  revalidatePath("/admin", "page");
  revalidatePath("/admin/registrations", "page");
  revalidatePath("/admin/performance-orders", "page");
  revalidatePath("/admin/orders", "page");
  revalidatePath("/admin/attendance", "layout");

  if (courseId) {
    revalidatePath(`/courses/${courseId}`, "page");
  }
}
