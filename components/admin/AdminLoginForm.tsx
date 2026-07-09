"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import type { LoginInput } from "@/lib/validation/auth-schema";

type AdminLoginFormProps = {
  redirectTo?: string | null;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateField = <K extends keyof LoginInput>(key: K, value: LoginInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn(form, redirectTo);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="admin-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          className={inputClass}
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="text-sm font-medium text-foreground">
          密碼
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          className={inputClass}
          disabled={isPending}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "登入中…" : "登入"}
      </button>

      <p className="text-center text-sm text-muted">
        <Link href="/" className="transition hover:text-foreground">
          返回網站
        </Link>
      </p>
    </form>
  );
}
