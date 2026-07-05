export type FacultyMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
};

export const faculty: FacultyMember[] = [
  {
    id: "1",
    name: "陳明德",
    role: "藝術總監",
    bio: "20 年表演藝術經驗，專精魔術與劇場導演。",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
  },
  {
    id: "2",
    name: "林雅文",
    role: "戲劇教師",
    bio: "北藝大戲劇系畢業，擅長即興劇場與表演技巧教學。",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80",
  },
  {
    id: "3",
    name: "張子晴",
    role: "舞蹈教師",
    bio: "現代舞與 Hip Hop 背景，專注肢體開發與舞台呈現。",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80",
  },
];
