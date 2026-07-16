import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AttendanceCourseSessions } from "@/components/admin/AttendanceCourseSessions";
import { getCourseSessionAttendanceItems } from "@/lib/attendance/queries";
import { getCourseById } from "@/lib/courses/queries";

export const dynamic = "force-dynamic";

type AdminAttendanceCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({
  params,
}: AdminAttendanceCoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  return {
    title: course ? `${course.title} · 出席管理` : "出席管理",
    robots: { index: false, follow: false },
  };
}

export default async function AdminAttendanceCoursePage({
  params,
}: AdminAttendanceCoursePageProps) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  const sessions = await getCourseSessionAttendanceItems(courseId);

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader title="出席管理" description={course.title} />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <AttendanceCourseSessions
          courseId={course.id}
          courseTitle={course.title}
          sessions={sessions}
        />
      </main>
    </div>
  );
}
