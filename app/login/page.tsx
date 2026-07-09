import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "管理員登入",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
            管理員登入
          </h1>
          <p className="mt-2 text-sm text-muted">請使用管理員帳號登入後台</p>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase 尚未設定。請在{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5">.env.local</code>{" "}
            設定環境變數後重新啟動開發伺服器。
          </div>
        ) : (
          <AdminLoginForm redirectTo={next} />
        )}
      </div>
    </div>
  );
}
