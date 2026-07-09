"use server";

import { redirect } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { loginSchema, type LoginInput } from "@/lib/validation/auth-schema";

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

function sanitizeRedirectPath(path?: string | null): string {
  if (!path || !path.startsWith("/admin")) {
    return "/admin";
  }
  return path;
}

export async function signIn(
  input: LoginInput,
  redirectTo?: string | null,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定，無法登入" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error:
        error.message === "Invalid login credentials"
          ? "Email 或密碼錯誤"
          : "登入失敗，請稍後再試",
    };
  }

  redirect(sanitizeRedirectPath(redirectTo));
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
