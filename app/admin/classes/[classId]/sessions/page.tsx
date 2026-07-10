import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionManagement } from "@/components/admin/SessionManagement";
import { getClassById } from "@/lib/classes/queries";
import { getCourseById } from "@/lib/courses/queries";
import { getSessionsByClassId, usesSessionsTable } from "@/lib/sessions/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

type AdminClassSessionsPageProps = {
  params: Promise<{ classId: string }>;
};

export async function generateMetadata({
  params,
}: AdminClassSessionsPageProps): Promise<Metadata> {
  const { classId } = await params;
  const courseClass = await getClassById(classId);

  return {
    title: courseClass ? `${courseClass.name} · 上課日期管理` : "上課日期管理",
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function AdminClassSessionsPage({
  params,
}: AdminClassSessionsPageProps) {
  const { classId } = await params;
  const courseClass = await getClassById(classId);

  if (!courseClass) {
    notFound();
  }

  const course = await getCourseById(courseClass.courseId);
  if (!course) {
    notFound();
  }

  const sessions = await getSessionsByClassId(classId);
  const hasSessionsTable = await usesSessionsTable();

  return (
    <div className="min-h-screen bg-background">
      <SessionManagement
        course={course}
        courseClass={courseClass}
        sessions={sessions}
        canMutate={isSupabaseConfigured() && hasSessionsTable}
      />
    </div>
  );
}
