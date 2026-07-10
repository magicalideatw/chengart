"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/lib/actions/admin/events";
import { formatEventDateLabel } from "@/lib/events/format";
import type { EventRecord } from "@/lib/events/types";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EventFormModal } from "@/components/admin/EventFormModal";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { Toast } from "@/components/ui/Toast";

type EventManagementProps = {
  events: EventRecord[];
  canMutate: boolean;
};

type ToastState = { title: string; message?: string };

export function EventManagement({ events, canMutate }: EventManagementProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.sortOrder - b.sortOrder),
    [events],
  );

  const showToast = (title: string, message?: string) => setToast({ title, message });

  const handleDelete = (event: EventRecord) => {
    if (!canMutate) {
      showToast("無法刪除", "請確認 Supabase 已設定、已登入，且已執行 migration 009");
      return;
    }

    const confirmed = window.confirm(`確定要刪除「${event.title}」嗎？`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteEvent(event.id);
      if (result.success) {
        showToast("已刪除活動");
        router.refresh();
        return;
      }
      showToast("刪除失敗", result.error);
    });
  };

  return (
    <>
      <AdminPageHeader
        title="活動管理"
        description="新增、編輯與刪除活動。首頁「近期招生與演出」會顯示「首頁顯示」且排序前 3 筆。"
        count={events.length}
        countLabel="活動數"
        showAction={canMutate}
        actionLabel="新增活動"
        onAction={() => setShowCreate(true)}
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {!canMutate && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            目前無法修改活動。請確認 Supabase 已設定、已登入管理員，並在 SQL Editor 執行{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5">
              supabase/migrations/009_events_cms.sql
            </code>
            與{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5">
              010_event_covers_storage.sql
            </code>
            。
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  {[
                    "封面",
                    "活動名稱",
                    "類型",
                    "狀態",
                    "日期",
                    "首頁",
                    "精選",
                    "排序",
                    "",
                  ].map((label) => (
                    <th
                      key={label || "actions"}
                      className="px-5 py-4 font-medium text-muted"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-muted">
                      尚無活動，請新增第一筆活動。
                    </td>
                  </tr>
                ) : (
                  sortedEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-4">
                        {event.coverImage ? (
                          <div className="relative h-12 w-16 overflow-hidden rounded-lg border border-border">
                            <Image
                              src={event.coverImage}
                              alt={event.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="mt-1 text-xs text-muted">/events/{event.slug}</p>
                      </td>
                      <td className="px-5 py-4 text-muted">{event.eventType}</td>
                      <td className="px-5 py-4">
                        <EventStatusBadge status={event.status} />
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {formatEventDateLabel(event.startDate, event.endDate)}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {event.showOnHomepage ? "是" : "否"}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {event.isFeatured ? "是" : "否"}
                      </td>
                      <td className="px-5 py-4 text-muted">{event.sortOrder}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(event)}
                            disabled={!canMutate || isPending}
                            className="rounded-full border border-border p-2 text-muted transition hover:text-foreground disabled:opacity-40"
                            aria-label={`編輯 ${event.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(event)}
                            disabled={!canMutate || isPending}
                            className="rounded-full border border-border p-2 text-muted transition hover:text-red-600 disabled:opacity-40"
                            aria-label={`刪除 ${event.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showCreate ? (
        <EventFormModal
          onClose={() => setShowCreate(false)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await createEvent(input);
            if (result.success) {
              setShowCreate(false);
              showToast("已新增活動");
              router.refresh();
            }
            return result;
          }}
        />
      ) : null}

      {editing ? (
        <EventFormModal
          event={editing}
          onClose={() => setEditing(null)}
          isPending={isPending}
          onSubmit={async (input) => {
            const result = await updateEvent(editing.id, input);
            if (result.success) {
              setEditing(null);
              showToast("已更新活動");
              router.refresh();
            }
            return result;
          }}
        />
      ) : null}

      <Toast
        title={toast?.title ?? ""}
        message={toast?.message}
        visible={Boolean(toast)}
        onClose={() => setToast(null)}
      />
    </>
  );
}
