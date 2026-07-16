import type { OrderFulfillmentStatus } from "@/lib/orders/order-status";
import type { OrderFormData } from "@/lib/orders/order-form-data";
import type { PricingSnapshot } from "@/lib/pricing/types";
import type { PaymentMethod, PaymentStatus } from "@/lib/payment/types";

export type OrderStatus =
  | Exclude<PaymentStatus, "refunded">
  | "failed";

export type OrderRecord = {
  id: string;
  merchant_trade_no: string;
  course_id: string;
  course_title: string;
  status: OrderStatus;
  order_status: OrderFulfillmentStatus;
  payment_status: PaymentStatus;
  amount: number;
  subtotal: number | null;
  discount_total: number;
  promo_code: string | null;
  pricing_snapshot: PricingSnapshot | Record<string, unknown>;
  payment_method: PaymentMethod | null;
  ecpay_trade_no: string | null;
  registration_id: string | null;
  name: string;
  email: string;
  phone: string;
  form_data: OrderFormData;
  paid_at: string | null;
  transfer_reported: boolean;
  transfer_last5: string | null;
  transfer_date: string | null;
  transfer_time: string | null;
  transfer_note: string | null;
  transfer_reported_at: string | null;
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
