import type { PageMetadataInput } from "@/lib/seo/metadata";

export type HomeSectionSeo = {
  id: string;
  name: string;
  description: string;
};

export const homeSectionSeo: HomeSectionSeo[] = [
  {
    id: "about",
    name: "關於晟心誠藝劇團",
    description:
      "認識晟心誠藝劇團的藝術理念、教學團隊與服務對象，了解我們如何以魔術、戲劇、舞蹈推動藝術教育。",
  },
  {
    id: "latest-performances",
    name: "最新演出",
    description:
      "查看最新演出資訊、購票方式與檔期，掌握晟心誠藝劇團的公開演出與售票活動。",
  },
  {
    id: "courses",
    name: "藝術課程",
    description:
      "瀏覽魔術、戲劇、舞蹈與夏令營等藝術課程，找到適合兒童、青少年與成人的學習方案。",
  },
  {
    id: "news",
    name: "最新消息",
    description:
      "掌握晟心誠藝劇團最新公告、活動消息與重要通知。",
  },
  {
    id: "contact",
    name: "聯絡我們",
    description:
      "透過 Email、社群或表單聯絡晟心誠藝劇團，洽詢課程、演出、合作與場地租借。",
  },
];

export const pageSeo = {
  home: {
    title: "魔術、戲劇、舞蹈藝術教育與專業演出",
    description:
      "晟心誠藝劇團提供魔術、戲劇、舞蹈課程、夏令營、專業演出與場地租借，服務桃園中原、中壢及全台學校與企業。",
    path: "/",
  },
  space: {
    title: "二階藝術空間場地租借",
    description:
      "位於桃園中壢中原夜市商圈的二階藝術空間，提供排練、工作坊、講座與小型活動場地租借，歡迎預約參觀。",
    path: "/space",
    imageAlt: "二階藝術空間場地租借",
  },
} satisfies Record<string, PageMetadataInput>;
