import type { Metadata } from "next";
import { CourseManagement } from "@/components/admin/CourseManagement";
import { getClassCountsByCourseIds } from "@/lib/classes/queries";
import {
  getAllCourses,
  getEnrollmentCountsByCourseIds,
  usesLegacyCourseSchema,
} from "@/lib/courses/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "課程管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const courses = await getAllCourses();
  const courseIds = courses.map((course) => course.id).filter(Boolean);
  const enrollmentCounts = await getEnrollmentCountsByCourseIds(courseIds);
  const classCounts = await getClassCountsByCourseIds(courseIds);
  const isLegacySchema = await usesLegacyCourseSchema();

  return (
    <div className="min-h-screen bg-background">
      {isLegacySchema && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900 md:px-8">
          資料庫仍為舊版結構。請在 Supabase SQL Editor 執行{" "}
          <code className="rounded bg-white/70 px-1.5 py-0.5">
            supabase/migrations/002_restructure_courses.sql
          </code>{" "}
          以啟用完整課程管理功能。
        </div>
      )}

      <CourseManagement
        courses={courses}
        enrollmentCounts={enrollmentCounts}
        classCounts={classCounts}
        canMutate={isSupabaseConfigured() && !isLegacySchema}
      />
    </div>
  );
}
