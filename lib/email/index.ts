export {
  notifyAdminNewOrder,
  notifyParentBankTransferPending,
  notifyParentPaymentConfirmed,
  notifyParentPaymentSuccess,
  notifyParentRegistrationSuccess,
  isEmailConfigured,
} from "@/lib/email/dispatch";
export { sendEmail, sendEmailsSafely } from "@/lib/email/service";
export { buildOrderEmailData } from "@/lib/email/build-order-email-data";
export type {
  OrderEmailData,
  OrderEmailEvent,
  RenderedEmail,
} from "@/lib/email/types";
