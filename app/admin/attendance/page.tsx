import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AttendanceOverview } from "@/components/admin/AttendanceOverview";
import {
  getTaipeiTodayIsoDate,
  getTodaySessionAttendanceItems,
  usesAttendanceTable,
} from "@/lib/attendance/queries";
import { getAllCourses } from "@/lib/courses/queries";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "出席管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  const today = getTaipeiTodayIsoDate();
  const [courses, todaySessions, hasAttendanceTable, user] = await Promise.all([
    getAllCourses(),
    getTodaySessionAttendanceItems(today),
    usesAttendanceTable(),
    getAuthenticatedUser(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="出席管理"
        description="依課程或今日上課堂次進行點名"
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {!hasAttendanceTable ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            請先在 Supabase 執行 <code>027_attendance.sql</code> 以啟用出席管理。
          </div>
        ) : null}

        {!user ? (
          <div className="mb-6 rounded-2xl border border-border bg-white px-5 py-4 text-sm text-muted">
            請登入後方可儲存點名紀錄。
          </div>
        ) : null}

        <AttendanceOverview
          courses={courses}
          todaySessions={todaySessions}
          todayLabel={today.replaceAll("-", "/")}
        />
      </main>
    </div>
  );
}
