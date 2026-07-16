import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { fetchAdminRegistrations } from "@/lib/admin/registrations";
import { getStudentAttendanceStatsMap } from "@/lib/attendance/queries";
import { getAllCourses } from "@/lib/courses/queries";

export const metadata: Metadata = {
  title: "報名管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminRegistrationsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminRegistrationsPage({
  searchParams,
}: AdminRegistrationsPageProps) {
  const [{ q }, { registrations, canMutate, error }, courses] =
    await Promise.all([
      searchParams,
      fetchAdminRegistrations(),
      getAllCourses(),
    ]);

  console.log(
    `[admin/registrations/page] render queryParam="${q ?? ""}" fetchError=${error ?? "null"} registrationsCount=${registrations.length} coursesCount=${courses.length} canMutate=${canMutate}`,
  );
  console.log("[page]", registrations.length);

  const studentIds = registrations.flatMap((registration) =>
    registration.students.map((student) => student.id).filter(Boolean),
  );
  const statsMap = await getStudentAttendanceStatsMap(studentIds);
  const studentStatsMap = Object.fromEntries(statsMap.entries());

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
            initialQuery={q ?? ""}
            studentStatsMap={studentStatsMap}
          />
        )}
      </main>
    </div>
  );
}
