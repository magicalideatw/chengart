export type PerformanceServiceItem = {
  id: string;
  title: string;
  description: string;
  icon: "school" | "building" | "theater" | "festival";
};

export const performanceServicesContent = {
  label: "Performance Services",
  title: "演出服務",
  intro: [
    "我們提供校園巡演、企業活動、劇場演出、大型活動、親子活動及藝術教育等多元演出服務。",
    "每場演出皆可依不同年齡層、場地規模及活動需求量身規劃，結合戲劇、魔術與舞蹈，打造兼具娛樂性、互動性與教育意義的表演內容，為每位觀眾留下深刻且難忘的體驗。",
  ],
  image: "/images/performance-services.jpg",
  alt: "晟心誠藝劇團三位演員舞台演出",
};

export const performanceServices: PerformanceServiceItem[] = [
  {
    id: "1",
    title: "校園巡演",
    description:
      "帶著原創戲劇、魔術與互動演出走進校園，讓藝術成為孩子成長的一部分。",
    icon: "school",
  },
  {
    id: "2",
    title: "企業活動",
    description: "尾牙、春酒、家庭日、品牌活動、企業包場及客製化演出規劃。",
    icon: "building",
  },
  {
    id: "3",
    title: "劇場演出",
    description:
      "原創戲劇、親子劇、魔術劇場與售票演出，打造兼具娛樂與藝術性的作品。",
    icon: "theater",
  },
  {
    id: "4",
    title: "大型活動",
    description: "文化節慶、政府活動、商業活動及舞台節目整體策劃與執行。",
    icon: "festival",
  },
];
