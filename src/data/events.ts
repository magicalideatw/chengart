export type EventStatus = "招生中" | "即將額滿" | "已額滿" | "已結束";

export type EventHighlight = {
  icon: string;
  title: string;
  description: string;
};

export type EventTimelineItem = {
  session: string;
  title: string;
};

export type EventInstructor = {
  name: string;
  role: string;
  bio: string;
  avatar: string;
};

export type EventFAQ = {
  question: string;
  answer: string;
};

export type Event = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: EventStatus;
  capacity: number;
  registered: number;
  date: string;
  time: string;
  location: string;
  age: string;
  price: string;
  heroImage: string;
  gallery: string[];
  highlights: EventHighlight[];
  timeline: EventTimelineItem[];
  instructors: EventInstructor[];
  faq: EventFAQ[];
};

export const events: Event[] = [
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
    price: "NT$ 2,800",
    heroImage:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1503099229945-8938207465c0?w=900&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80",
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&q=80",
      "https://images.unsplash.com/photo-1507676184292-758854542ecc?w=900&q=80",
    ],
    highlights: [
      {
        icon: "🎩",
        title: "魔術技巧",
        description: "培養觀察力與創意。",
      },
      {
        icon: "🎭",
        title: "戲劇表演",
        description: "提升表達能力與自信。",
      },
      {
        icon: "💃",
        title: "肢體律動",
        description: "建立舞台魅力。",
      },
      {
        icon: "⭐",
        title: "成果發表",
        description: "真正站上舞台演出。",
      },
    ],
    timeline: [
      { session: "第一堂", title: "認識魔術" },
      { session: "第二堂", title: "肢體表達" },
      { session: "第三堂", title: "戲劇遊戲" },
      { session: "第四堂", title: "成果排練" },
      { session: "第五堂", title: "正式演出" },
    ],
    instructors: [
      {
        name: "陳明德",
        role: "藝術總監",
        bio: "20 年魔術與劇場教學經驗，專精兒童表演啟發。",
        avatar:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
      },
      {
        name: "林雅文",
        role: "戲劇教師",
        bio: "北藝大戲劇系畢業，擅長即興劇場與兒童戲劇引導。",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
      },
    ],
    faq: [
      {
        question: "需要準備什麼物品？",
        answer: "請穿著方便活動的服裝，其餘材料由劇團提供。",
      },
      {
        question: "可以試上或退費嗎？",
        answer: "開課前 7 日可申請全額退費，詳情請聯繫我們。",
      },
      {
        question: "沒有基礎可以參加嗎？",
        answer: "可以，本課程從零基礎開始，依年齡分組教學。",
      },
      {
        question: "成果發表會家人可以觀賞嗎？",
        answer: "第五堂正式演出開放家人入場，每位學員可邀請 2 位親友。",
      },
    ],
  },
  {
    id: "summer-camp-2026",
    slug: "summer-camp-2026",
    title: "2026 夏日魔法營",
    subtitle: "五天密集體驗，探索魔術、戲劇與舞蹈的創意世界。",
    status: "招生中",
    capacity: 20,
    registered: 18,
    date: "2026/07/15 — 07/19",
    time: "09:30~16:30",
    location: "晟心誠藝劇團 台北工作室",
    age: "8~14 歲",
    price: "NT$ 12,800",
    heroImage:
      "https://images.unsplash.com/photo-1503099229945-8938207465c0?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80",
    ],
    highlights: [
      {
        icon: "🎩",
        title: "魔術探索",
        description: "近景與舞台魔術入門。",
      },
      {
        icon: "🎭",
        title: "戲劇創作",
        description: "故事發想與角色扮演。",
      },
      {
        icon: "💃",
        title: "舞蹈律動",
        description: "身體協調與節奏感。",
      },
      {
        icon: "⭐",
        title: "成果展演",
        description: "營隊結束公開演出。",
      },
    ],
    timeline: [
      { session: "Day 1", title: "破冰與魔術基礎" },
      { session: "Day 2", title: "戲劇與表達" },
      { session: "Day 3", title: "舞蹈與肢體" },
      { session: "Day 4", title: "綜合排練" },
      { session: "Day 5", title: "成果發表" },
    ],
    instructors: [
      {
        name: "張子晴",
        role: "舞蹈教師",
        bio: "現代舞背景，擅長兒童律動與創意編舞。",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
      },
    ],
    faq: [
      {
        question: "包含午餐嗎？",
        answer: "是的，每日提供午餐與點心。",
      },
      {
        question: "可以只報名部分天數嗎？",
        answer: "本營隊需全程參加，不提供單日報名。",
      },
    ],
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
    price: "NT$ 5,200",
    heroImage:
      "https://images.unsplash.com/photo-1507676184292-758854542ecc?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80",
    ],
    highlights: [
      {
        icon: "🎭",
        title: "即興技巧",
        description: "Yes, and 核心原則。",
      },
      {
        icon: "🎩",
        title: "角色塑造",
        description: "快速進入角色狀態。",
      },
      {
        icon: "💃",
        title: "肢體即興",
        description: "以身體說故事。",
      },
      {
        icon: "⭐",
        title: "公開呈現",
        description: "期末小型演出。",
      },
    ],
    timeline: [
      { session: "第一堂", title: "即興基礎" },
      { session: "第二堂", title: "場景建構" },
      { session: "第三堂", title: "角色深化" },
      { session: "第四堂", title: "排練" },
      { session: "第五堂", title: "公開演出" },
    ],
    instructors: [
      {
        name: "林雅文",
        role: "戲劇教師",
        bio: "即興劇場專家，曾赴芝加哥進修。",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
      },
    ],
    faq: [
      {
        question: "完全零基礎可以嗎？",
        answer: "可以，本工作坊歡迎所有程度的成人學員。",
      },
    ],
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
    price: "NT$ 2,400",
    heroImage:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1547153520-96c8ec9291b5?w=900&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80",
    ],
    highlights: [
      { icon: "💃", title: "Hip Hop 基礎", description: "節奏感與協調訓練。" },
      { icon: "🎭", title: "肢體表達", description: "用身體說故事。" },
      { icon: "⭐", title: "舞台呈現", description: "期末小型展演。" },
      { icon: "🎩", title: "跨域整合", description: "結合戲劇元素。" },
    ],
    timeline: [
      { session: "第一堂", title: "暖身與節奏" },
      { session: "第二堂", title: "基本步法" },
      { session: "第三堂", title: "編舞創意" },
      { session: "第四堂", title: "排練" },
      { session: "第五堂", title: "成果發表" },
    ],
    instructors: [
      {
        name: "張子晴",
        role: "舞蹈教師",
        bio: "現代舞與 Hip Hop 背景，專注兒童律動教學。",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
      },
    ],
    faq: [
      {
        question: "需要舞蹈基礎嗎？",
        answer: "不需要，課程從零基礎開始。",
      },
    ],
  },
];

export function getEventBySlug(slug: string): Event | undefined {
  return events.find((e) => e.slug === slug);
}

export function getRemainingSpots(event: Event): number {
  return Math.max(0, event.capacity - event.registered);
}

export function getDisplayStatus(event: Event): EventStatus {
  if (event.status === "已結束") return "已結束";

  const remaining = getRemainingSpots(event);
  if (remaining === 0) return "已額滿";
  if (remaining <= 3) return "即將額滿";
  return "招生中";
}

export function canRegister(event: Event): boolean {
  return getDisplayStatus(event) !== "已額滿" && getDisplayStatus(event) !== "已結束";
}

export function getStatusConfig(status: EventStatus) {
  const configs = {
    招生中: { emoji: "🟢", label: "招生中", className: "bg-emerald-50 text-emerald-700" },
    即將額滿: { emoji: "🟡", label: "即將額滿", className: "bg-amber-50 text-amber-700" },
    已額滿: { emoji: "🔴", label: "已額滿", className: "bg-red-50 text-red-700" },
    已結束: { emoji: "⚫", label: "已結束", className: "bg-neutral-100 text-neutral-600" },
  };
  return configs[status];
}
