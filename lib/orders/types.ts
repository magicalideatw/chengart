import type { RegistrationOrderFormData } from "@/lib/registration/types";
import type { PaymentMethod, PaymentStatus } from "@/lib/payment/types";

export type OrderStatus = PaymentStatus | "failed";

export type OrderRecord = {
  id: string;
  merchant_trade_no: string;
  course_id: string;
  course_title: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  amount: number;
  payment_method: PaymentMethod | null;
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

export function isOrderPaid(order: Pick<OrderRecord, "payment_status" | "status">): boolean {
  return order.payment_status === "paid" || order.status === "paid";
}

export function canFulfillOrder(order: Pick<OrderRecord, "payment_status" | "status">): boolean {
  return (
    order.payment_status === "pending" ||
    order.payment_status === "waiting_transfer" ||
    order.status === "pending" ||
    order.status === "waiting_transfer"
  );
}
