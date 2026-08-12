import type { PageMetadataInput } from "@/lib/seo/metadata";

export type HomeSectionSeo = {
  id: string;
  name: string;
  description: string;
  path: string;
};

export const homeSectionSeo: HomeSectionSeo[] = [
  {
    id: "about",
    name: "關於晟心誠藝劇團",
    description:
      "認識晟心誠藝劇團的藝術理念、教學團隊與服務對象，了解我們如何以魔術、戲劇、舞蹈推動藝術教育。",
    path: "/about",
  },
  {
    id: "latest-performances",
    name: "最新演出",
    description:
      "查看最新演出資訊、購票方式與檔期，掌握晟心誠藝劇團的公開演出與售票活動。",
    path: "/performances",
  },
  {
    id: "courses",
    name: "藝術課程",
    description:
      "瀏覽魔術、戲劇、舞蹈與夏令營等藝術課程，找到適合兒童、青少年與成人的學習方案。",
    path: "/courses",
  },
  {
    id: "news",
    name: "最新消息",
    description:
      "掌握晟心誠藝劇團最新公告、活動消息與重要通知。",
    path: "/news",
  },
  {
    id: "contact",
    name: "聯絡我們",
    description:
      "透過 Email、社群或表單聯絡晟心誠藝劇團，洽詢課程、演出、合作與場地租借。",
    path: "/contact",
  },
];

export const pageSeo = {
  home: {
    title: "晟心誠藝劇團｜桃園魔術、戲劇、舞蹈與藝術教育",
    absoluteTitle: true,
    description:
      "晟心誠藝劇團立足桃園中壢，提供魔術、戲劇、舞蹈藝術教育與專業演出。歡迎報名課程、欣賞演出，或洽詢場地租借與合作。",
    path: "/",
  },
  courses: {
    title: "藝術課程｜魔術、戲劇、舞蹈",
    description:
      "瀏覽晟心誠藝劇團公開招生的魔術、戲劇、舞蹈與冬夏令營課程，了解課程內容、費用與報名方式。",
    path: "/courses",
  },
  performances: {
    title: "最新演出｜晟心誠藝劇團",
    description:
      "查看晟心誠藝劇團最新公開演出、場次資訊與購票方式，掌握精彩檔期。",
    path: "/performances",
  },
  events: {
    title: "最新消息與活動",
    description:
      "掌握晟心誠藝劇團最新活動、招生消息與重要公告，了解近期課程與演出動態。",
    path: "/events",
  },
  about: {
    title: "關於晟心誠藝劇團",
    description:
      "認識晟心誠藝劇團的成立背景、藝術理念與服務範圍，了解我們如何以魔術、戲劇、舞蹈推動藝術教育。",
    path: "/about",
  },
  news: {
    title: "最新消息",
    description:
      "查看晟心誠藝劇團最新公告、活動通知與重要消息。",
    path: "/news",
  },
  contact: {
    title: "聯絡我們",
    description:
      "透過 Email 或社群聯絡晟心誠藝劇團，洽詢課程報名、演出邀約、活動合作與場地租借。",
    path: "/contact",
  },
  space: {
    title: "中壢場地租借｜二階藝術空間｜晟心誠藝劇團",
    absoluteTitle: true,
    description:
      "位於桃園中壢中原夜市商圈的二階藝術空間，提供排練、舞蹈、工作坊、講座與小型活動場地租借。地址：桃園市中壢區三和二街10號2樓。",
    path: "/space",
    imageAlt: "中壢二階藝術空間場地租借",
  },
} satisfies Record<string, PageMetadataInput>;
