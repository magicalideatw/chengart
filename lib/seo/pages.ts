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
      "認識晟心誠藝劇團，以魔術、戲劇、舞蹈與藝術教育為核心，透過演出與教學推動表演藝術，創造更多元的藝術體驗。",
    path: "/about",
  },
  {
    id: "performances",
    name: "魔術與戲劇演出服務",
    description:
      "晟心誠藝劇團提供魔術、戲劇、舞蹈及綜合舞台演出，適合企業活動、校園活動、藝文活動、親子活動與各類節慶演出。",
    path: "/performances",
  },
  {
    id: "courses",
    name: "魔術・戲劇・舞蹈課程",
    description:
      "晟心誠藝劇團提供魔術、戲劇、舞蹈與表演藝術課程，透過舞台訓練、肢體表達與創意學習，培養孩子與學員的自信、表達力與舞台能力。",
    path: "/courses",
  },
  {
    id: "events",
    name: "藝文活動與演出",
    description:
      "探索晟心誠藝劇團最新藝文活動、舞台演出、藝術教育活動與親子活動，透過魔術、戲劇與舞蹈創造更多元的藝術體驗。",
    path: "/events",
  },
  {
    id: "space",
    name: "中壢藝術空間",
    description:
      "晟心誠藝劇團提供中壢藝術空間與場地租借服務，適合舞蹈、戲劇、魔術、排練、教學、講座及小型活動使用。",
    path: "/space",
  },
  {
    id: "news",
    name: "最新消息",
    description:
      "查看晟心誠藝劇團最新演出、課程、活動、藝術教育與劇團消息。",
    path: "/news",
  },
  {
    id: "contact",
    name: "聯絡晟心誠藝劇團",
    description:
      "歡迎聯絡晟心誠藝劇團，洽詢魔術、戲劇、舞蹈演出、藝術教育、課程、活動合作與場地租借。",
    path: "/contact",
  },
];

export const pageSeo = {
  home: {
    title: "晟心誠藝劇團｜魔術 × 戲劇 × 舞蹈｜演出與藝術教育",
    absoluteTitle: true,
    description:
      "晟心誠藝劇團以魔術、戲劇與舞蹈為核心，提供舞台演出、藝術教育、兒童課程、活動企劃與場地空間服務，致力於讓藝術走進生活。",
    path: "/",
    keywords: [
      "晟心誠藝劇團",
      "魔術表演",
      "戲劇",
      "舞蹈",
      "藝術教育",
      "桃園藝文",
      "中壢魔術",
      "兒童藝術課程",
    ],
  },
  performances: {
    title: "魔術與戲劇演出服務｜活動表演｜晟心誠藝劇團",
    absoluteTitle: true,
    description:
      "晟心誠藝劇團提供魔術、戲劇、舞蹈及綜合舞台演出，適合企業活動、校園活動、藝文活動、親子活動與各類節慶演出。",
    path: "/performances",
    keywords: [
      "魔術表演",
      "舞台魔術",
      "活動表演",
      "魔術師",
      "戲劇演出",
      "舞蹈演出",
      "企業活動表演",
      "校園活動表演",
      "桃園魔術表演",
    ],
  },
  courses: {
    title: "魔術・戲劇・舞蹈課程｜藝術教育｜晟心誠藝劇團",
    absoluteTitle: true,
    description:
      "晟心誠藝劇團提供魔術、戲劇、舞蹈與表演藝術課程，透過舞台訓練、肢體表達與創意學習，培養孩子與學員的自信、表達力與舞台能力。",
    path: "/courses",
    keywords: [
      "魔術課程",
      "兒童魔術課程",
      "戲劇課程",
      "舞蹈課程",
      "表演藝術課程",
      "兒童藝術教育",
      "桃園才藝課程",
      "中壢才藝課程",
    ],
  },
  events: {
    title: "藝文活動與演出｜晟心誠藝劇團",
    absoluteTitle: true,
    description:
      "探索晟心誠藝劇團最新藝文活動、舞台演出、藝術教育活動與親子活動，透過魔術、戲劇與舞蹈創造更多元的藝術體驗。",
    path: "/events",
    keywords: [
      "藝文活動",
      "桃園藝文活動",
      "中壢藝文活動",
      "親子活動",
      "魔術活動",
      "戲劇活動",
      "藝術活動",
    ],
  },
  space: {
    title: "中壢藝術空間｜場地出租・教室租借｜晟心誠藝劇團",
    absoluteTitle: true,
    description:
      "晟心誠藝劇團提供中壢藝術空間與場地租借服務，適合舞蹈、戲劇、魔術、排練、教學、講座及小型活動使用。",
    path: "/space",
    imageAlt: "中壢二階藝術空間場地租借",
    keywords: [
      "中壢藝術空間",
      "中壢場地出租",
      "中壢教室出租",
      "中壢場地租借",
      "中壢排練場",
      "中壢舞蹈教室",
      "藝術空間",
      "活動場地",
    ],
  },
  about: {
    title: "關於晟心誠藝劇團｜魔術・戲劇・舞蹈・藝術教育",
    absoluteTitle: true,
    description:
      "認識晟心誠藝劇團，以魔術、戲劇、舞蹈與藝術教育為核心，透過演出與教學推動表演藝術，創造更多元的藝術體驗。",
    path: "/about",
    keywords: [
      "晟心誠藝劇團",
      "桃園劇團",
      "中壢劇團",
      "魔術劇團",
      "戲劇",
      "舞蹈",
      "藝術教育",
    ],
  },
  news: {
    title: "最新消息｜晟心誠藝劇團",
    absoluteTitle: true,
    description:
      "查看晟心誠藝劇團最新演出、課程、活動、藝術教育與劇團消息。",
    path: "/news",
    keywords: [
      "晟心誠藝劇團",
      "劇團消息",
      "演出消息",
      "藝術活動",
      "魔術活動",
      "藝術教育",
    ],
  },
  contact: {
    title: "聯絡晟心誠藝劇團｜演出・課程・活動合作",
    absoluteTitle: true,
    description:
      "歡迎聯絡晟心誠藝劇團，洽詢魔術、戲劇、舞蹈演出、藝術教育、課程、活動合作與場地租借。",
    path: "/contact",
    keywords: [
      "晟心誠藝劇團",
      "魔術表演合作",
      "活動演出",
      "藝術教育",
      "場地租借",
    ],
  },
} satisfies Record<string, PageMetadataInput>;
