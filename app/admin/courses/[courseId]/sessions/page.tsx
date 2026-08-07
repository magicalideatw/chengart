import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseSessionManagement } from "@/components/admin/CourseSessionManagement";
import { getCourseById } from "@/lib/courses/queries";
import { getSessionManagementTitle } from "@/lib/sessions/labels";
import { getSessionsByCourseId, usesSessionsTable } from "@/lib/sessions/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

type AdminCourseSessionsPageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({
  params,
}: AdminCourseSessionsPageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  return {
    title: course
      ? `${course.title} · ${getSessionManagementTitle(course.activityType)}`
      : "場次管理",
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function AdminCourseSessionsPage({
  params,
}: AdminCourseSessionsPageProps) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  const sessions = await getSessionsByCourseId(courseId);
  const hasSessionsTable = await usesSessionsTable();

  return (
    <div className="min-h-screen bg-background">
      <CourseSessionManagement
        course={course}
        sessions={sessions}
        canMutate={isSupabaseConfigured() && hasSessionsTable}
      />
    </div>
  );
}
