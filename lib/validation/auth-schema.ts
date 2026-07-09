import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "請填寫 Email")
    .email("請輸入有效的 Email"),
  password: z.string().min(1, "請填寫密碼"),
});

export type LoginInput = z.infer<typeof loginSchema>;
