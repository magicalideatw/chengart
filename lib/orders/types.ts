import type { RegistrationOrderFormData } from "@/lib/registration/types";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderRecord = {
  id: string;
  merchant_trade_no: string;
  course_id: string;
  course_title: string;
  status: OrderStatus;
  amount: number;
  payment_method: string | null;
  ecpay_trade_no: string | null;
  registration_id: string | null;
  name: string;
  email: string;
  phone: string;
  form_data: RegistrationOrderFormData;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderListItem = OrderRecord;
