import { ActivityCoursesSection } from "@/components/home/ActivityCoursesSection";

type LatestPerformancesSectionProps = {
  headingLevel?: "h1" | "h2";
};

export async function LatestPerformancesSection({
  headingLevel = "h2",
}: LatestPerformancesSectionProps = {}) {
  return (
    <ActivityCoursesSection
      activityType="performance"
      headingLevel={headingLevel}
    />
  );
}
