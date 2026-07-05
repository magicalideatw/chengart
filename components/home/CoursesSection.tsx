import { courseListings } from "@/lib/data/course-listings";
import { CourseCard } from "@/components/home/CourseCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CoursesSection() {
  return (
    <section id="courses" className="bg-surface py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label="Courses"
            title="藝術課程"
            description="冬夏令營、魔術、戲劇與舞蹈 — 依年齡與程度設計的專業藝術教育。"
          />
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {courseListings.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
