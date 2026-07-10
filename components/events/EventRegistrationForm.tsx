"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { EventPageData } from "@/lib/events/types";
import { canRegister, getClosedRegistrationLabel } from "@/lib/events/status";
import { isAdultEvent } from "@/src/data/events";
import { FadeIn } from "@/components/ui/FadeIn";

type EventRegistrationFormProps = {
  event: EventPageData;
};

type FormData = {
  name: string;
  phone: string;
  email: string;
  childName: string;
  childAge: string;
  note: string;
};

const initialForm: FormData = {
  name: "",
  phone: "",
  email: "",
  childName: "",
  childAge: "",
  note: "",
};

type FieldConfig = {
  name: keyof Pick<FormData, "name" | "phone" | "email" | "childName" | "childAge">;
  label: string;
  type: string;
  required: boolean;
};

export function EventRegistrationForm({ event }: EventRegistrationFormProps) {
  const [form, setForm] = useState<FormData>(initialForm);
  const [success, setSuccess] = useState(false);
  const open = canRegister(event.status);
  const isAdult = isAdultEvent(event);
  const buttonText = event.registrationButtonText || "立即報名";

  if (event.registrationUrl) {
    if (!open) return null;

    return (
      <section id="register" className="py-12 sm:py-16">
        <FadeIn>
          <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
            立即報名
          </h2>
          <p className="mt-2 text-sm text-muted">{event.title}</p>
        </FadeIn>

        <FadeIn className="mt-8" delay={0.08}>
          <Link
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90"
          >
            {buttonText}
          </Link>
        </FadeIn>
      </section>
    );
  }

  const baseFields: FieldConfig[] = [
    { name: "name", label: "姓名", type: "text", required: true },
    { name: "phone", label: "電話", type: "tel", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ];

  const childFields: FieldConfig[] = [
    { name: "childName", label: "孩子姓名", type: "text", required: true },
    { name: "childAge", label: "孩子年齡", type: "text", required: true },
  ];

  const fields = isAdult ? baseFields : [...baseFields, ...childFields];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!open) return;
    setSuccess(true);
  };

  return (
    <section id="register" className="py-12 sm:py-16">
      <FadeIn>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          立即報名
        </h2>
        <p className="mt-2 text-sm text-muted">{event.title}</p>
      </FadeIn>

      <FadeIn className="mt-8" delay={0.08}>
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="py-12 text-center"
              >
                <p className="text-4xl" aria-hidden>
                  🎉
                </p>
                <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
                  報名成功！
                </h3>
                <p className="mt-2 text-sm text-muted">我們會盡快與您聯絡。</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {fields.map((field) => (
                  <div key={field.name}>
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-foreground"
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      required={field.required}
                      value={form[field.name]}
                      onChange={handleChange}
                      disabled={!open}
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50"
                    />
                  </div>
                ))}

                <div>
                  <label
                    htmlFor="note"
                    className="block text-sm font-medium text-foreground"
                  >
                    備註
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={3}
                    value={form.note}
                    onChange={handleChange}
                    disabled={!open}
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50"
                  />
                </div>

                {open ? (
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full rounded-full bg-foreground py-3.5 text-sm font-medium text-white transition hover:bg-foreground/90"
                  >
                    送出報名
                  </motion.button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-full bg-surface py-3.5 text-sm font-medium text-mist"
                  >
                    {getClosedRegistrationLabel(event.status)}
                  </button>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </FadeIn>
    </section>
  );
}
