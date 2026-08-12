import { ActivityCoursesSection } from "@/components/home/ActivityCoursesSection";

type CoursesSectionProps = {
  headingLevel?: "h1" | "h2";
};

export async function CoursesSection({
  headingLevel = "h2",
}: CoursesSectionProps = {}) {
  return (
    <ActivityCoursesSection activityType="course" headingLevel={headingLevel} />
  );
}
