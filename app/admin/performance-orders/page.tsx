import type { Metadata } from "next";
import { PerformanceOrderManagement } from "@/components/admin/PerformanceOrderManagement";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  buildPerformanceCourseIdSet,
  buildPerformanceCourseMap,
  buildPerformanceCourseOptions,
  enrichPerformanceOrderList,
  filterPerformanceOrders,
} from "@/lib/admin/performance-order-management";
import { getAllCourses } from "@/lib/courses/queries";
import { getAllOrders } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "演出購票",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPerformanceOrdersPage() {
  const [orders, courses, user] = await Promise.all([
    getAllOrders(),
    getAllCourses(),
    getAuthenticatedUser(),
  ]);

  const performanceCourseIds = buildPerformanceCourseIdSet(courses);
  const performanceCourses = buildPerformanceCourseOptions(courses);
  const courseById = buildPerformanceCourseMap(performanceCourses);
  const performanceOrders = enrichPerformanceOrderList(
    filterPerformanceOrders(orders, performanceCourseIds),
    courseById,
  );

  return (
    <div className="min-h-screen bg-background">
      <PerformanceOrderManagement
        orders={performanceOrders}
        performanceCourses={performanceCourses}
        canMutate={Boolean(user)}
      />
    </div>
  );
}
