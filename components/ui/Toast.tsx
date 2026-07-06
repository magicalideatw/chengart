"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

type ToastProps = {
  title: string;
  message?: string;
  visible: boolean;
  onClose: () => void;
};

export function Toast({ title, message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-foreground px-5 py-4 text-center shadow-lg"
          role="alert"
        >
          <p className="text-sm font-medium text-white">{title}</p>
          {message && (
            <p className="mt-1 text-xs text-white/70">{message}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
