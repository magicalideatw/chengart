"use client";

import { ActivityDetailsSection } from "@/components/courses/ActivityDetailsSection";

type CourseDetailsSectionProps = {
  courseDetails: string;
};

export function CourseDetailsSection({ courseDetails }: CourseDetailsSectionProps) {
  return <ActivityDetailsSection content={courseDetails} />;
}
