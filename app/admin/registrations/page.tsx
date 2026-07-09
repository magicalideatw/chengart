import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { fetchAdminRegistrations } from "@/lib/admin/registrations";
import { getAllCourses } from "@/lib/courses/queries";

export const metadata: Metadata = {
  title: "報名管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const [{ registrations, canMutate, error }, courses] = await Promise.all([
    fetchAdminRegistrations(),
    getAllCourses(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="報名管理"
        description="查看、搜尋、編輯與刪除所有課程報名資料"
        count={registrations.length}
        countLabel="總報名"
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            無法載入報名資料：{error}
          </div>
        ) : (
          <RegistrationTable
            registrations={registrations}
            courses={courses}
            canMutate={canMutate}
          />
        )}
      </main>
    </div>
  );
}
