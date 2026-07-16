import type { Metadata } from "next";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getAllCourses } from "@/lib/courses/queries";
import { getAllOrders } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "訂單管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const [{ orderId }, orders, courses, user] = await Promise.all([
    searchParams,
    getAllOrders(),
    getAllCourses(),
    getAuthenticatedUser(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <OrderManagement
        orders={orders}
        courses={courses}
        canMutate={Boolean(user)}
        focusOrderId={orderId}
      />
    </div>
  );
}
