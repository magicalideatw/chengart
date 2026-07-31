"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitSpaceRentalInquiry } from "@/lib/actions/space-rental";
import { spaceRentalContent } from "@/lib/data/space-rental";
import type { SpaceRentalTimeSlotOption } from "@/lib/validation/space-rental-schema";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

const sectionClass =
  "rounded-3xl border border-border bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8";

export function SpaceInquirySection() {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rentalDate, setRentalDate] = useState("");
  const [timeSlotOption, setTimeSlotOption] = useState<
    SpaceRentalTimeSlotOption | ""
  >("");
  const [customRentalTime, setCustomRentalTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { inquiry, footerCta } = spaceRentalContent;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitSpaceRentalInquiry({
        name,
        email,
        phone,
        rentalDate,
        timeSlotOption: timeSlotOption as SpaceRentalTimeSlotOption,
        customRentalTime: customRentalTime || undefined,
        purpose,
        note,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setRentalDate("");
      setTimeSlotOption("");
      setCustomRentalTime("");
      setPurpose("");
      setNote("");
    });
  }

  return (
    <>
      <section id="inquiry" className="bg-white py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <FadeIn>
            <SectionHeader
              label={inquiry.label}
              title={inquiry.title}
              description={inquiry.description}
              align="center"
            />
          </FadeIn>

          <FadeIn className="mx-auto mt-10 max-w-2xl sm:mt-14" delay={0.08}>
            <div className="mb-5 rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-muted sm:px-6 sm:py-5">
              {inquiry.calendarHint}
            </div>

            <form onSubmit={handleSubmit} className={sectionClass}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    姓名 <span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Email <span className="text-gold">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    電話 <span className="text-gold">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    租借日期 <span className="text-gold">*</span>
                  </label>
                  <input
                    type="date"
                    value={rentalDate}
                    onChange={(event) => setRentalDate(event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    租借時段 <span className="text-gold">*</span>
                  </label>
                  <select
                    value={timeSlotOption}
                    onChange={(event) => {
                      const value = event.target.value as
                        | SpaceRentalTimeSlotOption
                        | "";
                      setTimeSlotOption(value);
                      if (value !== "custom") {
                        setCustomRentalTime("");
                      }
                    }}
                    className={inputClass}
                    required
                  >
                    <option value="" disabled>
                      請選擇租借時段
                    </option>
                    {inquiry.timeSlotOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {timeSlotOption === "custom" ? (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      {inquiry.customTimeSlotLabel}{" "}
                      <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      value={customRentalTime}
                      onChange={(event) => setCustomRentalTime(event.target.value)}
                      placeholder={inquiry.customTimeSlotPlaceholder}
                      className={inputClass}
                      required
                    />
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    使用用途 <span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    placeholder="例如：戲劇排練、工作坊"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    備註
                  </label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>

              {error ? (
                <p className="mt-5 text-sm text-red-600">{error}</p>
              ) : null}

              {success ? (
                <div className="mt-5 space-y-2 text-sm text-foreground">
                  <p className="font-medium">{inquiry.successMessage.title}</p>
                  <p className="leading-relaxed text-muted">
                    {inquiry.successMessage.description}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isPending ? "送出中…" : inquiry.submitButtonLabel}
              </button>

              <p className="mt-4 text-xs leading-relaxed text-mist">
                {inquiry.submitDisclaimer}
              </p>
            </form>
          </FadeIn>
        </div>
      </section>

      <section className="bg-foreground py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
          <FadeIn>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {footerCta.title}
            </h2>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              {footerCta.subtitle}
            </p>
            <Link
              href="#inquiry"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-white transition hover:bg-gold-light"
            >
              {footerCta.buttonLabel}
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
