import { z } from "zod";
import { spaceRentalContent } from "@/lib/data/space-rental";

export const spaceRentalTimeSlotOptions = [
  "a",
  "b",
  "c",
  "full",
  "custom",
] as const;

export type SpaceRentalTimeSlotOption =
  (typeof spaceRentalTimeSlotOptions)[number];

export const spaceRentalInquirySchema = z
  .object({
    name: z.string().trim().min(1, "請填寫姓名"),
    email: z.string().trim().email("請填寫有效的 Email"),
    phone: z.string().trim().min(1, "請填寫電話"),
    rentalDate: z.string().trim().min(1, "請填寫租借日期"),
    timeSlotOption: z.enum(spaceRentalTimeSlotOptions, {
      error: "請選擇租借時段",
    }),
    customRentalTime: z.string().trim().optional(),
    purpose: z.string().trim().min(1, "請填寫使用用途"),
    note: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.timeSlotOption === "custom" && !data.customRentalTime?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["customRentalTime"],
        message: "請填寫自訂租借時間",
      });
    }
  });

export type SpaceRentalInquiryInput = z.infer<typeof spaceRentalInquirySchema>;

export function resolveSpaceRentalTimeSlot(
  option: SpaceRentalTimeSlotOption,
  customRentalTime?: string,
): string {
  if (option === "custom") {
    return customRentalTime?.trim() ?? "";
  }

  return (
    spaceRentalContent.inquiry.timeSlotOptions.find(
      (item) => item.value === option,
    )?.label ?? option
  );
}

export type SpaceRentalInquiryEmailData = SpaceRentalInquiryInput & {
  rentalTimeSlot: string;
};
