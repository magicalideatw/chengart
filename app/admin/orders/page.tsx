import type { Metadata } from "next";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getAllOrders } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "訂單管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, user] = await Promise.all([getAllOrders(), getAuthenticatedUser()]);

  return (
    <div className="min-h-screen bg-background">
      <OrderManagement orders={orders} canMutate={Boolean(user)} />
    </div>
  );
}
