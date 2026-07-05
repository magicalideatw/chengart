"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function RegistrationSuccessScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md rounded-3xl border border-border bg-white p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
      >
        <p className="text-5xl">🎉</p>
        <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">
          報名成功！
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          我們已收到您的報名。
          <br />
          將於 24 小時內與您聯絡。
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-medium text-white transition hover:bg-foreground/90"
          >
            返回首頁
          </Link>
          <Link
            href="/#courses"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-foreground/30"
          >
            查看更多課程
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
