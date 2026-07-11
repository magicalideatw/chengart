import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseRegistrationFlow } from "@/components/courses/registration/CourseRegistrationFlow";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCourseWithEnrollment } from "@/lib/courses/queries";
import { getCourseCoverAbsoluteUrl } from "@/lib/courses/cover-image";
import { siteConfig } from "@/lib/data/site";
import { getCourseRegistrationPlan } from "@/lib/registration/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseWithEnrollment(id);

  if (!course) {
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

  if (!course) {
    notFound();
  }

  const plan =
    (await getCourseRegistrationPlan(course.id)) ?? {
      usesSessions: false,
      classes: [],
      defaultUnitPrice: course.fee,
      hasSelectableSessions: false,
    };

  return (
    <>
      <Navbar variant="light" />
      <main className="bg-background pb-16">
        <CourseRegistrationFlow course={course} plan={plan} />
      </main>
      <Footer />
    </>
  );
}
