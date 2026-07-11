import type { ActiveRegistrationType } from "@/lib/courses/registration-mode";

export type RegistrationPaymentStatus = "pending" | "paid" | "cancelled";

export type AdminRegistrationSession = {
  registrationId: string;
  sessionId: string | null;
  date: string;
  start_time: string;
  end_time: string;
  className: string;
  scheduleLine: string;
  compactLine: string;
};

export type AdminOrderStudent = {
  id: string;
  student_name: string;
  student_age: string;
  gender: string | null;
  is_first_time: boolean;
  note: string | null;
  sessions: AdminRegistrationSession[];
  registrationIds: string[];
};

export type AdminOrderRegistration = {
  id: string;
  order_id: string | null;
  registrationIds: string[];
  course_id: string;
  status: RegistrationPaymentStatus;
  name: string;
  phone: string;
  email: string;
  parent_note: string | null;
  created_at: string;
  courseTitle: string;
  courseCategory: string;
  students: AdminOrderStudent[];
  studentCount: number;
  registrationType: ActiveRegistrationType;
  orderAmount: number | null;
  studentNames: string[];
  slotEnrollment: number;
  maxCapacity: number;
};

/** @deprecated use AdminOrderRegistration */
export type AdminRegistration = AdminOrderRegistration;

export type AdminOrderUpdate = {
  orderId: string | null;
  registrationIds: string[];
  courseId: string;
  name: string;
  phone: string;
  email: string;
  parentNote: string;
  students: Array<{
    id?: string;
    studentName: string;
    studentAge: string;
    gender: string;
    isFirstTime: boolean;
    note: string;
    sessionIds: string[];
    registrationIds: string[];
  }>;
};

/** @deprecated */
export type AdminRegistrationUpdate = {
  ids: string[];
  courseId: string;
  name: string;
  phone: string;
  email: string;
  studentName: string;
  studentAge: string;
  isFirstTime: boolean;
  note: string;
};

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };
