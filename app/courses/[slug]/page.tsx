import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseRegistrationFlow } from "@/components/courses/registration/CourseRegistrationFlow";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getAllCourseSlugs, getCourseBySlug } from "@/src/data/courses";
import { siteConfig } from "@/lib/data/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllCourseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    return { title: "課程不存在" };
  }

  return {
    title: `${course.title} | ${siteConfig.name}`,
    description: course.subtitle,
    openGraph: {
      title: course.title,
      description: course.subtitle,
      images: [{ url: course.coverImage, width: 1200, height: 630 }],
    },
  };
}

export default async function CourseRegistrationPage({ params }: PageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return (
    <>
      <Navbar variant="light" />
      <main className="bg-background pb-16">
        <CourseRegistrationFlow course={course} />
      </main>
      <Footer />
    </>
  );
}
