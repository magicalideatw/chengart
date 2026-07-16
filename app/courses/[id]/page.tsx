import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseRegistrationFlow } from "@/components/courses/registration/CourseRegistrationFlow";
import { PerformancePurchaseFlow } from "@/components/courses/performance/PerformancePurchaseFlow";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { isPublicCourse } from "@/lib/courses/activity-status";
import { getCourseCoverAbsoluteUrl } from "@/lib/courses/cover-image";
import { siteConfig } from "@/lib/data/site";
import { courseHasPromoCodes } from "@/lib/promo/queries";
import { getCourseRegistrationPlan } from "@/lib/registration/queries";
import { getActiveTicketTypesByCourseId } from "@/lib/ticket-types/queries";

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

  const coverImage = getCourseCoverAbsoluteUrl(course.coverImage, siteConfig.url);

  return {
    title: `${course.title} | ${siteConfig.name}`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [{ url: coverImage, width: 1200, height: 630 }],
    },
  };
}

export default async function CourseRegistrationPage({ params }: PageProps) {
  const { id } = await params;
  const course = await getCourseWithEnrollment(id);

  if (!course || !isPublicCourse(course.isOpen)) {
    notFound();
  }

  if (course.activityType === "performance") {
    const ticketTypes = await getActiveTicketTypesByCourseId(course.id);

    return (
      <>
        <Navbar variant="light" />
        <main className="bg-background pb-16">
          <PerformancePurchaseFlow course={course} ticketTypes={ticketTypes} />
        </main>
        <Footer />
      </>
    );
  }

  const [plan, hasPromoCodes] = await Promise.all([
    getCourseRegistrationPlan(course.id).then(
      (value) =>
        value ?? {
          usesSessions: false,
          classes: [],
          defaultUnitPrice: course.fee,
          hasSelectableSessions: false,
        },
    ),
    courseHasPromoCodes(course.id),
  ]);

  return (
    <>
      <Navbar variant="light" />
      <main className="bg-background pb-16">
        <CourseRegistrationFlow
          course={course}
          plan={plan}
          hasPromoCodes={hasPromoCodes}
        />
      </main>
      <Footer />
    </>
  );
}
