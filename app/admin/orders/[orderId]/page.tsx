import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/admin/OrderDetailView";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fetchAdminOrderDetail } from "@/lib/admin/order-detail";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "訂單詳情",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { orderId } = await params;
  const [detail, user] = await Promise.all([
    fetchAdminOrderDetail(orderId),
    getAuthenticatedUser(),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="訂單詳情"
        description={detail.order.course_title}
      />
      <OrderDetailView detail={detail} canMutate={Boolean(user)} />
    </div>
  );
}
