import type { Metadata } from "next";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { getAllOrders } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "訂單管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="min-h-screen bg-background">
      <OrderManagement orders={orders} />
    </div>
  );
}
