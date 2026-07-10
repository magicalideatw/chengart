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

export type AdminRegistration = {
  id: string;
  registrationIds: string[];
  course_id: string;
  order_id: string | null;
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
  sessions: AdminRegistrationSession[];
  sessionScheduleText: string;
  sessionDate: string;
  sessionDateLabel: string;
  sessionTime: string;
  className: string;
  slotEnrollment: number;
  maxCapacity: number;
};

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
