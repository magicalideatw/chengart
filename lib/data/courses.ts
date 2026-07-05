export type CourseCategory = {
  id: string;
  title: string;
  description: string;
  audiences: string[];
  items: string[];
};

export const courseCategories: CourseCategory[] = [
  {
    id: "magic",
    title: "魔術",
    description: "從基礎手法到舞台呈現，培養表演力與舞台魅力。",
    audiences: ["兒童", "青少年", "成人"],
    items: ["魔術入門", "舞台魔術", "近距離魔術", "舞台表演"],
  },
  {
    id: "drama",
    title: "戲劇",
    description: "透過角色與故事，探索表達、聆聽與創造力。",
    audiences: ["兒童", "青少年", "成人"],
    items: ["戲劇表演", "即興劇場", "表演技巧", "口語表達"],
  },
  {
    id: "dance",
    title: "舞蹈",
    description: "以身體探索節奏與情感，建立舞台自信。",
    audiences: ["兒童", "青少年", "成人"],
    items: ["Hip Hop", "舞蹈律動", "肢體開發", "舞台舞蹈"],
  },
  {
    id: "training",
    title: "表演培訓",
    description: "面向進修學員與表演工作者的專業培訓課程。",
    audiences: ["青少年", "成人"],
    items: ["教師培訓", "比賽培訓", "劇場創作", "演員培訓"],
  },
];
