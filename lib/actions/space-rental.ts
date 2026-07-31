"use server";

import { sendNewSpaceRentalInquiryEmail } from "@/lib/email";
import {
  resolveSpaceRentalTimeSlot,
  spaceRentalInquirySchema,
  type SpaceRentalInquiryEmailData,
  type SpaceRentalInquiryInput,
} from "@/lib/validation/space-rental-schema";

export type SubmitSpaceRentalInquiryResult =
  | { success: true }
  | { success: false; error: string };

export async function submitSpaceRentalInquiry(
  input: SpaceRentalInquiryInput,
): Promise<SubmitSpaceRentalInquiryResult> {
  const parsed = spaceRentalInquirySchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  const data: SpaceRentalInquiryEmailData = {
    ...parsed.data,
    rentalTimeSlot: resolveSpaceRentalTimeSlot(
      parsed.data.timeSlotOption,
      parsed.data.customRentalTime,
    ),
  };

  const sent = await sendNewSpaceRentalInquiryEmail({
    name: data.name,
    email: data.email,
    phone: data.phone,
    rentalDate: data.rentalDate,
    rentalTimeSlot: data.rentalTimeSlot,
    purpose: data.purpose,
    note: data.note,
  });

  if (!sent) {
    return {
      success: false,
      error: "寄送失敗，請稍後再試或直接 Email 聯絡我們",
    };
  }

  return { success: true };
}
