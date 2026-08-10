export type CoursePlan = {
  id: string;
  courseId: string;
  name: string;
  sessionCount: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CoursePlanFormInput = {
  name: string;
  sessionCount: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
};
