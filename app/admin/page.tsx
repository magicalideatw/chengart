import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fetchAdminDashboardData } from "@/lib/admin/dashboard";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "後台總覽",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [user, dashboard] = await Promise.all([
    getAuthenticatedUser(),
    fetchAdminDashboardData(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Dashboard"
        description={user ? `歡迎回來，${user.email ?? "管理員"}` : "管理後台總覽"}
      />

      <AdminDashboard data={dashboard} canMutate={Boolean(user)} />
    </div>
  );
}
