"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { eventRecordToFormInput, mapEventRow, mapEventToDb } from "@/lib/events/mappers";
import { getAllEvents, getEventById } from "@/lib/events/queries";
import { ensureUniqueEventSlug } from "@/lib/events/slug";
import type { EventFormInput, EventRecord } from "@/lib/events/types";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { adminEventSchema } from "@/lib/validation/admin-event-schema";
import { copyEventSchema } from "@/lib/validation/copy-event-schema";

export type CopyEventResult =
  | { success: true; event: EventRecord }
  | { success: false; error: string };

function buildCopyEventInput(
  source: EventRecord,
  title: string,
  slug: string,
  options: {
    copyIntro: boolean;
    copyCoverImage: boolean;
    copySessions: boolean;
    copyRegistrationSettings: boolean;
  },
): EventFormInput {
  const base = eventRecordToFormInput(source);
  const today = new Date().toISOString().slice(0, 10);

  return {
    ...base,
    slug,
    title,
    subtitle: options.copyIntro ? base.subtitle : "",
    intro: options.copyIntro ? base.intro : "",
    content: options.copyIntro ? base.content : "",
    coverImage: options.copyCoverImage ? base.coverImage : "",
    startDate: options.copySessions ? base.startDate : today,
    endDate: options.copySessions ? base.endDate : "",
    registrationButtonText: options.copyRegistrationSettings
      ? base.registrationButtonText
      : "立即報名",
    registrationUrl: options.copyRegistrationSettings ? base.registrationUrl : "",
    status: options.copyRegistrationSettings ? base.status : "招生中",
    eventType: options.copyRegistrationSettings ? base.eventType : base.eventType,
    showOnHomepage: false,
    isFeatured: false,
    sortOrder: base.sortOrder,
  };
}

function revalidateEventPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/admin/events");
  revalidatePath(`/events/${slug}`);
}

export async function copyEvent(input: unknown): Promise<CopyEventResult> {
  await requireAuthenticatedUser();

  const parsed = copyEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "表單資料有誤",
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 尚未設定，無法複製活動" };
  }

  const {
    sourceEventId,
    title,
    slug,
    copyIntro,
    copyCoverImage,
    copySessions,
    copyRegistrationSettings,
  } = parsed.data;

  const source = await getEventById(sourceEventId);
  if (!source) {
    return { success: false, error: "找不到來源活動" };
  }

  const existingEvents = await getAllEvents();
  const takenSlugs = new Set(existingEvents.map((event) => event.slug));
  const uniqueSlug = await ensureUniqueEventSlug(slug, async (candidate) =>
    takenSlugs.has(candidate),
  );

  const formInput = buildCopyEventInput(source, title, uniqueSlug, {
    copyIntro,
    copyCoverImage,
    copySessions,
    copyRegistrationSettings,
  });

  const forValidation: EventFormInput = {
    ...formInput,
    coverImage: formInput.coverImage || source.coverImage || "copy-placeholder",
  };

  const validated = adminEventSchema.safeParse(forValidation);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "複製資料有誤",
    };
  }

  const payload = mapEventToDb(validated.data);
  if (!copyCoverImage) {
    payload.cover_image = "";
  }

  const supabase = await createServerClient();
  const { data: inserted, error } = await supabase
    .from("events")
    .insert(payload)
    .select("*")
    .single();

  if (error || !inserted) {
    console.error("Copy event failed:", error?.message);
    if (error?.code === "23505") {
      return { success: false, error: "此網址代稱已被使用，請改用其他代稱" };
    }
    return { success: false, error: "建立副本失敗，請稍後再試" };
  }

  const event = mapEventRow(inserted);
  revalidateEventPaths(event.slug);
  return { success: true, event };
}
