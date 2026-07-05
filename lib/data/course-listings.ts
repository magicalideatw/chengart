export type CourseListing = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  audiences: string[];
  href: string;
};

export const courseListings: CourseListing[] = [
  {
    id: "camp",
    title: "冬／夏令營",
    description: "假期密集體驗，融合魔術、戲劇與舞蹈的跨域藝術探索。",
    coverImage:
      "https://images.unsplash.com/photo-1503099229945-8938207465c0?w=900&q=80",
    audiences: ["6–12 歲"],
    href: "/courses/camp",
  },
  {
    id: "magic",
    title: "魔術課",
    description: "從基礎手法到舞台呈現，培養觀察力、創意與表演自信。",
    coverImage:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80",
    audiences: ["6–12 歲", "13–17 歲", "18 歲以上"],
    href: "/courses/magic",
  },
  {
    id: "drama",
    title: "戲劇課",
    description: "透過角色與故事，鍛鍊表達、聆聽與舞台存在感。",
    coverImage:
      "https://images.unsplash.com/photo-1507676184292-758854542ecc?w=900&q=80",
    audiences: ["6–12 歲", "13–17 歲", "18 歲以上"],
    href: "/courses/drama",
  },
  {
    id: "dance",
    title: "舞蹈課",
    description: "以身體探索節奏與情感，建立肢體語言與舞台魅力。",
    coverImage:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80",
    audiences: ["6–12 歲", "13–17 歲", "18 歲以上"],
    href: "/courses/dance",
  },
];
