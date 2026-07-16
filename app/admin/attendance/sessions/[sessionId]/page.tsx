import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AttendanceSessionView } from "@/components/admin/AttendanceSessionView";
import {
  getSessionAttendanceContext,
  usesAttendanceTable,
} from "@/lib/attendance/queries";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { formatSessionDate } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

type AdminAttendanceSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export async function generateMetadata({
  params,
}: AdminAttendanceSessionPageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const context = await getSessionAttendanceContext(sessionId);

  return {
    title: context
      ? `${context.courseTitle} · ${formatSessionDate(context.sessionDate)}`
      : "點名",
    robots: { index: false, follow: false },
  };
}

export default async function AdminAttendanceSessionPage({
  params,
}: AdminAttendanceSessionPageProps) {
  const { sessionId } = await params;
  const [context, user, hasAttendanceTable] = await Promise.all([
    getSessionAttendanceContext(sessionId),
    getAuthenticatedUser(),
    usesAttendanceTable(),
  ]);

  if (!context) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="點名"
        description={`${context.courseTitle} · ${context.className}`}
      />

      <main className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        {!hasAttendanceTable ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            請先在 Supabase 執行 <code>027_attendance.sql</code> 以啟用出席管理。
          </div>
        ) : null}

        <AttendanceSessionView
          context={context}
          canMutate={Boolean(user) && hasAttendanceTable}
        />
      </main>
    </div>
  );
}
