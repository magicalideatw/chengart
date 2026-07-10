import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassManagement } from "@/components/admin/ClassManagement";
import { getClassesByCourseId, usesClassesTable } from "@/lib/classes/queries";
import { getCourseById } from "@/lib/courses/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

type AdminCourseClassesPageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({
  params,
}: AdminCourseClassesPageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  return {
    title: course ? `${course.title} · 班別管理` : "班別管理",
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function AdminCourseClassesPage({
  params,
}: AdminCourseClassesPageProps) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) {
    notFound();
  }

  const classes = await getClassesByCourseId(courseId);
  const hasClassesTable = await usesClassesTable();

  return (
    <div className="min-h-screen bg-background">
      <ClassManagement
        course={course}
        classes={classes}
        canMutate={isSupabaseConfigured() && hasClassesTable}
      />
    </div>
  );
}
