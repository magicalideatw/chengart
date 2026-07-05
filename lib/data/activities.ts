export type Activity = {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  image: string;
};

export const activities: Activity[] = [
  {
    id: "1",
    slug: "summer-camp-2026",
    title: "2026 夏令營",
    date: "2026.07.15 — 07.26",
    description: "暑期密集藝術體驗，融合魔術、戲劇與舞蹈的跨域創意營隊。",
    image:
      "https://images.unsplash.com/photo-1503099229945-8938207465c0?w=800&q=80",
  },
  {
    id: "2",
    slug: "magic-kids-2026",
    title: "魔術小演員",
    date: "2026.08.03 起",
    description: "從基礎手法到舞台呈現，培養自信與表演力的魔術課程。",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
  },
  {
    id: "3",
    slug: "adult-improv-2026",
    title: "成人即興劇場",
    date: "2026.09.01 起",
    description: "以即興為核心的戲劇工作坊，探索表達、聆聽與創造力。",
    image:
      "https://images.unsplash.com/photo-1507676184292-758854542ecc?w=800&q=80",
  },
  {
    id: "4",
    slug: "dance-rhythm-2026",
    title: "舞蹈律動",
    date: "2026.09.10 起",
    description: "Hip Hop 與律動基礎，從身體開發到舞台呈現的完整路徑。",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  },
];
