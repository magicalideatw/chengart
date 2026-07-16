import type { DiscountType } from "@/lib/pricing/types";
import type { RegistrationMode } from "@/lib/courses/registration-mode";
import type { ActivityType } from "@/lib/courses/activity-type";
import type { ParticipationMethod } from "@/lib/courses/participation-method";
import type { PaymentMethod, PaidPaymentMethod } from "@/lib/payment/types";

export const COURSE_CATEGORIES = [
  "冬夏令營",
  "魔術",
  "戲劇",
  "舞蹈",
  "其他",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export const TRANSFER_DEADLINE_DAY_OPTIONS = [3, 7, 14] as const;

export type Course = {
  id: string;
  title: string;
  category: string;
  description: string;
  courseDetails: string;
  activityType: ActivityType;
  activityRules: string;
  participationMethod: ParticipationMethod;
  externalUrl: string | null;
  actionButtonText: string;
  sessionDate: string;
  sessionTime: string;
  capacity: number;
  fee: number;
  coverImage: string;
  isOpen: boolean;
  allowedPaymentMethods: PaymentMethod[];
  registrationMode: RegistrationMode;
  pricePerStudent: number;
  registrationDeadline: string | null;
  showRemainingCapacity: boolean;
  transferDeadlineDays: number | null;
  earlyBirdEnabled: boolean;
  earlyBirdDeadline: string | null;
  earlyBirdDiscountType: DiscountType | null;
  earlyBirdDiscountValue: number;
  groupDiscountEnabled: boolean;
  groupDiscountMinStudents: number | null;
  groupDiscountType: DiscountType | null;
  groupDiscountValue: number;
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
  pricePerStudent: number;
  href: string;
  isOpen: boolean;
  activityType: ActivityType;
  participationMethod: ParticipationMethod;
  externalUrl: string | null;
  actionButtonText: string;
};

export type CourseFormInput = {
  title: string;
  category: string;
  description: string;
  courseDetails: string;
  activityType: ActivityType;
  activityRules: string;
  participationMethod: ParticipationMethod;
  externalUrl: string;
  actionButtonText: string;
  isOpen: boolean;
  sessionDate: string;
  sessionTime: string;
  capacity: number;
  coverImage: string;
  allowedPaymentMethods: PaidPaymentMethod[];
  registrationMode: RegistrationMode;
  pricePerStudent: number;
  registrationDeadline: string;
  showRemainingCapacity: boolean;
  transferDeadlineDays: number | null;
  earlyBirdEnabled: boolean;
  earlyBirdDeadline: string;
  earlyBirdDiscountType: DiscountType | null;
  earlyBirdDiscountValue: number;
  groupDiscountEnabled: boolean;
  groupDiscountMinStudents: number | null;
  groupDiscountType: DiscountType | null;
  groupDiscountValue: number;
};
