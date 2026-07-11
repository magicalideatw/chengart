import type { PaymentMethod } from "@/lib/payment/types";
import type { RegistrationMode } from "@/lib/courses/registration-mode";

export const COURSE_CATEGORIES = [
  "冬夏令營",
  "魔術",
  "戲劇",
  "舞蹈",
  "其他",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export type Course = {
  id: string;
  title: string;
  category: string;
  description: string;
  sessionDate: string;
  sessionTime: string;
  capacity: number;
  fee: number;
  coverImage: string;
  isOpen: boolean;
  allowedPaymentMethods: PaymentMethod[];
  registrationMode: RegistrationMode;
  pricePerStudent: number;
  createdAt: string;
  updatedAt: string;
};

export type CourseWithEnrollment = Course & {
  enrollmentCount: number;
  isFull: boolean;
};

export type CourseListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  fee: number;
  href: string;
  isOpen: boolean;
};

export type CourseFormInput = {
  title: string;
  category: string;
  description: string;
  sessionDate: string;
  sessionTime: string;
  capacity: number;
  fee: number;
  coverImage: string;
  isOpen: boolean;
  allowedPaymentMethods: PaymentMethod[];
  registrationMode: RegistrationMode;
  pricePerStudent: number;
};
