import type { PaymentMethod, PaymentStatus } from "@/lib/payment/types";

export type OrderEmailStudent = {
  name: string;
  age: string;
  sessionDates: string;
  sessionTimes: string;
};

export type OrderEmailBankTransfer = {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transferDeadlineLabel: string;
  reminderText: string;
};

export type OrderEmailData = {
  courseTitle: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentNames: string;
  students: OrderEmailStudent[];
  sessionDate: string;
  sessionTime: string;
  paymentMethod: PaymentMethod | null;
  paymentMethodLabel: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  merchantTradeNo: string;
  subtotalLabel: string;
  discountLabel: string;
  promoCodeLabel: string;
  amountLabel: string;
  registeredAt: string;
  bankTransfer?: OrderEmailBankTransfer;
};

export type OrderEmailEvent =
  | "admin_new_order"
  | "parent_registration_success"
  | "parent_bank_transfer_pending"
  | "parent_payment_success"
  | "parent_payment_confirmed";

export type RenderedEmail = {
  subject: string;
  html: string;
};

/** @deprecated Use OrderEmailData */
export type RegistrationEmailData = {
  courseTitle: string;
  name: string;
  email: string;
  phone: string;
  sessionDate: string;
  sessionTime: string;
  enrollmentLabel: string;
  note: string;
  registeredAt: string;
  studentCount: number;
  students: Array<{
    name: string;
    age: string;
    sessions: string[];
    note: string;
  }>;
};
