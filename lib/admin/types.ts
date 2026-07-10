export type RegistrationPaymentStatus = "pending" | "paid" | "cancelled";

export type AdminSessionSlot = {
  date: string;
  dateLabel: string;
  timeLabel: string;
  className: string;
  detailLine: string;
};

export type AdminRegistration = {
  id: string;
  course_id: string;
  order_id: string | null;
  session_id: string | null;
  status: RegistrationPaymentStatus;
  name: string;
  phone: string;
  email: string;
  student_name: string;
  student_age: string;
  is_first_time: boolean;
  note: string | null;
  created_at: string;
  courseTitle: string;
  courseCategory: string;
  sessionDate: string;
  sessionDateLabel: string;
  sessionTime: string;
  className: string;
  sessionDetailLine: string;
  orderSessionSlots: AdminSessionSlot[];
  slotEnrollment: number;
  maxCapacity: number;
};

export type AdminRegistrationUpdate = {
  id: string;
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
