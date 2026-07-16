import { getPublicCoursesByActivityType } from "@/lib/courses/queries";
import {
  HOME_ACTIVITY_SECTIONS,
  type HomeActivityType,
} from "@/lib/courses/activity-type";
import { CourseCard } from "@/components/home/CourseCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const dynamic = "force-dynamic";

type ActivityCoursesSectionProps = {
  activityType: HomeActivityType;
};

export async function ActivityCoursesSection({
  activityType,
}: ActivityCoursesSectionProps) {
  const section = HOME_ACTIVITY_SECTIONS[activityType];
  const courses = await getPublicCoursesByActivityType(activityType);

  if (courses.length === 0) {
    return null;
  }

  return (
    <section
      id={section.sectionId}
      className={`${section.bgClassName} py-16 sm:py-24 md:py-32`}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={section.label}
            title={section.title}
            description={section.description}
          />
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
