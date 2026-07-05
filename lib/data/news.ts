export type NewsItem = {
  id: string;
  date: string;
  category: "公告" | "新聞" | "演出資訊";
  title: string;
  href: string;
};

export const newsItems: NewsItem[] = [
  {
    id: "1",
    date: "2026.06.28",
    category: "公告",
    title: "2026 夏令營正式開放報名",
    href: "#",
  },
  {
    id: "2",
    date: "2026.06.15",
    category: "新聞",
    title: "晟心誠藝劇團與台北表演藝術中心簽署合作備忘錄",
    href: "#",
  },
  {
    id: "3",
    date: "2026.06.01",
    category: "演出資訊",
    title: "秋季公開演出《幻象邊界》即將發表",
    href: "#",
  },
  {
    id: "4",
    date: "2026.05.20",
    category: "公告",
    title: "2026 秋季班課程表正式公告",
    href: "#",
  },
];
