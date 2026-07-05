export type CourseCategory = {
  id: string;
  icon: string;
  title: string;
  titleEn: string;
  audiences: string[];
  items: string[];
};

export const courseCategories: CourseCategory[] = [
  {
    id: "magic",
    icon: "🎩",
    title: "Magic",
    titleEn: "魔術",
    audiences: ["兒童", "青少年", "成人"],
    items: ["魔術入門", "舞台魔術", "近距離魔術", "舞台表演"],
  },
  {
    id: "drama",
    icon: "🎭",
    title: "Drama",
    titleEn: "戲劇",
    audiences: ["兒童", "青少年", "成人"],
    items: ["戲劇", "即興劇場", "表演技巧", "口語表達"],
  },
  {
    id: "dance",
    icon: "💃",
    title: "Dance",
    titleEn: "舞蹈",
    audiences: ["幼兒", "兒童", "成人"],
    items: ["Hip Hop", "舞蹈律動", "肢體開發", "舞台舞蹈"],
  },
  {
    id: "academy",
    icon: "⭐",
    title: "Academy",
    titleEn: "專業培訓",
    audiences: ["教師", "演員", "進修學員"],
    items: ["教師培訓", "比賽培訓", "劇場創作", "演員培訓"],
  },
];
