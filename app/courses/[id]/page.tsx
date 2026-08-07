import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseRegistrationFlow } from "@/components/courses/registration/CourseRegistrationFlow";
import { PerformancePurchaseFlow } from "@/components/courses/performance/PerformancePurchaseFlow";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { isPublicCourse } from "@/lib/courses/activity-status";
import { getCourseCoverAbsoluteUrl } from "@/lib/courses/cover-image";
import { siteConfig } from "@/lib/data/site";
import { courseHasPromoCodes } from "@/lib/promo/queries";
import { getCourseRegistrationPlan } from "@/lib/registration/queries";
import {
  buildCourseJsonLd,
  buildPerformanceEventJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getActiveTicketTypesByCourseId } from "@/lib/ticket-types/queries";
import { getVisibleCourseMediaByCourseId } from "@/lib/media/queries";
import { getOpenSessionsByCourseId } from "@/lib/sessions/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseWithEnrollment(id);

  if (!course || !isPublicCourse(course.isOpen)) {
    return { title: "課程不存在" };
  }

  const pagePath = `/courses/${course.id}`;
  const coverImage = getCourseCoverAbsoluteUrl(course.coverImage, siteConfig.url);
  const isPerformance = course.activityType === "performance";

  return buildPageMetadata({
    title: course.title,
    description: isPerformance
      ? `查看「${course.title}」演出資訊、場次與購票方式。`
      : `報名「${course.title}」藝術課程，了解課程內容、費用與上課資訊。`,
    path: pagePath,
    image: coverImage,
    imageAlt: isPerformance
      ? `${course.title} 演出海報`
      : `${course.title} 課程封面`,
  });
}

export default async function CourseRegistrationPage({ params }: PageProps) {
  const { id } = await params;
  const course = await getCourseWithEnrollment(id);

  if (!course || !isPublicCourse(course.isOpen)) {
    notFound();
  }

  const pageUrl = new URL(`/courses/${course.id}`, siteConfig.url).toString();
  const coverImage = getCourseCoverAbsoluteUrl(course.coverImage, siteConfig.url);
  const structuredData =
    course.activityType === "performance"
      ? buildPerformanceEventJsonLd(course, pageUrl, coverImage)
      : buildCourseJsonLd(course, pageUrl);

  if (course.activityType === "performance") {
    const [ticketTypes, sessions, mediaItems] = await Promise.all([
      getActiveTicketTypesByCourseId(course.id),
      getOpenSessionsByCourseId(course.id),
      getVisibleCourseMediaByCourseId(course.id),
    ]);

    return (
      <>
        <JsonLdScript data={structuredData} />
        <Navbar variant="space" />
        <main className="bg-background pb-16">
          <PerformancePurchaseFlow
            course={course}
            ticketTypes={ticketTypes}
            sessions={sessions}
            mediaItems={mediaItems}
          />
        </main>
        <Footer />
      </>
    );
  }

  const [plan, hasPromoCodes, mediaItems] = await Promise.all([
    getCourseRegistrationPlan(course.id).then(
      (value) =>
        value ?? {
          usesSessions: false,
          sessions: [],
          courseSessionOptions: [],
          defaultUnitPrice: course.fee,
          hasSelectableSessions: false,
        },
    ),
    courseHasPromoCodes(course.id),
    getVisibleCourseMediaByCourseId(course.id),
  ]);

  return (
    <>
      <JsonLdScript data={structuredData} />
      <Navbar variant="space" />
      <main className="bg-background pb-16">
        <CourseRegistrationFlow
          course={course}
          plan={plan}
          hasPromoCodes={hasPromoCodes}
          mediaItems={mediaItems}
        />
      </main>
      <Footer />
    </>
  );
}
