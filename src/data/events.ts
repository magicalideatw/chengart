export {
  EVENT_STATUSES,
  EVENT_TYPES,
  type EventStatus,
  type EventType,
} from "@/lib/events/constants";

export {
  canRegister,
  getClosedRegistrationLabel,
  getStatusConfig,
} from "@/lib/events/status";

export type {
  EventHighlight,
  EventTimelineItem,
  EventInstructor,
  EventFAQ,
} from "@/lib/events/types";

export type AudienceType = "adult" | "child";

export type StaticEvent = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: import("@/lib/events/constants").EventStatus;
  capacity: number;
  registered: number;
  date: string;
  time: string;
  location: string;
  age: string;
  audienceType: AudienceType;
  price: string;
  heroImage: string;
  gallery: string[];
  highlights: import("@/lib/events/types").EventHighlight[];
  timeline: import("@/lib/events/types").EventTimelineItem[];
  instructors: import("@/lib/events/types").EventInstructor[];
  faq: import("@/lib/events/types").EventFAQ[];
};

/** @deprecated Static fallback data — CMS events live in Supabase */
export const staticEvents: StaticEvent[] = [
  {
    id: "magic-kids-2026",
    slug: "magic-kids-2026",
    title: "2026 魔術小演員兒童成長班",
    subtitle: "從自信開始，讓孩子勇敢站上舞台。",
    status: "招生中",
    capacity: 12,
    registered: 8,
    date: "2026/09/05",
    time: "14:00~16:00",
    location: "二階藝術空間",
    age: "6~12 歲",
    audienceType: "child",
    price: "NT$ 2,800",
    heroImage:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1503099229945-8938207465c0?w=900&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80",
    ],
    highlights: [
      { icon: "🎩", title: "魔術技巧", description: "培養觀察力與創意。" },
      { icon: "🎭", title: "戲劇表演", description: "提升表達能力與自信。" },
    ],
    timeline: [
      { session: "第一堂", title: "認識魔術" },
      { session: "第二堂", title: "肢體表達" },
    ],
    instructors: [
      {
        name: "陳明德",
        role: "藝術總監",
        bio: "20 年魔術與劇場教學經驗。",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
      },
    ],
    faq: [
      {
        question: "需要準備什麼物品？",
        answer: "請穿著方便活動的服裝，其餘材料由劇團提供。",
      },
    ],
  },
  {
    id: "summer-camp-2026",
    slug: "summer-camp-2026",
    title: "2026 夏日魔法營",
    subtitle: "五天密集體驗，探索魔術、戲劇與舞蹈的創意世界。",
    status: "即將開始",
    capacity: 20,
    registered: 18,
    date: "2026/07/15 — 07/19",
    time: "09:30~16:30",
    location: "晟心誠藝劇團 台北工作室",
    age: "8~14 歲",
    audienceType: "child",
    price: "NT$ 12,800",
    heroImage:
      "https://images.unsplash.com/photo-1503099229945-8938207465c0?w=1600&q=80",
    gallery: [],
    highlights: [],
    timeline: [],
    instructors: [],
    faq: [],
  },
  {
    id: "adult-improv-2026",
    slug: "adult-improv-2026",
    title: "成人即興劇場工作坊",
    subtitle: "釋放創意，在即興中找到屬於你的舞台語言。",
    status: "已結束",
    capacity: 15,
    registered: 15,
    date: "2026/06/01 — 06/30",
    time: "19:30~21:30",
    location: "台中教室",
    age: "18 歲以上",
    audienceType: "adult",
    price: "NT$ 5,200",
    heroImage:
      "https://images.unsplash.com/photo-1507676184292-758854542ecc?w=1600&q=80",
    gallery: [],
    highlights: [],
    timeline: [],
    instructors: [],
    faq: [],
  },
  {
    id: "dance-rhythm-2026",
    slug: "dance-rhythm-2026",
    title: "舞蹈律動成長班",
    subtitle: "從身體出發，找到屬於你的節奏與舞台魅力。",
    status: "招生中",
    capacity: 16,
    registered: 10,
    date: "2026/09/10",
    time: "10:00~12:00",
    location: "二階藝術空間",
    age: "7~14 歲",
    audienceType: "child",
    price: "NT$ 2,400",
    heroImage:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80",
    gallery: [],
    highlights: [],
    timeline: [],
    instructors: [],
    faq: [],
  },
];

/** @deprecated Use lib/events/queries instead */
export const events = staticEvents;

export function isAdultEvent(event: { audienceType?: AudienceType }): boolean {
  return event.audienceType === "adult";
}

export function getRemainingSpots(event: {
  capacity?: number;
  registered?: number;
}): number {
  const capacity = event.capacity ?? 0;
  const registered = event.registered ?? 0;
  return Math.max(0, capacity - registered);
}
