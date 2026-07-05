export const siteConfig = {
  name: "晟心誠藝劇團",
  nameEn: "Cheng Art Theatre",
  tagline: "Magic × Drama × Dance",
  slogan: "讓藝術成為每個人成長的力量",
  description:
    "晟心誠藝劇團提供魔術、戲劇、舞蹈藝術教育與專業演出服務，服務兒童、青少年、成人、學校與企業。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://chengart.tw",
  email: "contact@chengart.tw",
  phone: "02-1234-5678",
  address: "台北市信義區表演藝術大道 1 號",
  line: "https://line.me/",
  facebook: "https://facebook.com/",
  instagram: "https://instagram.com/",
};

export const navLinks = [
  { label: "首頁", href: "/" },
  { label: "最新活動", href: "#activities" },
  { label: "課程", href: "#courses" },
  { label: "演出", href: "#performances" },
  { label: "關於", href: "#about" },
  { label: "聯絡", href: "#contact" },
];

export const footerLinks = [
  { label: "最新活動", href: "#activities" },
  { label: "課程", href: "#courses" },
  { label: "演出", href: "#performances" },
  { label: "關於", href: "#about" },
  { label: "聯絡", href: "#contact" },
];

export const heroVideo = {
  src: "https://videos.pexels.com/video-files/3129677/3129677-uhd_2560_1440_25fps.mp4",
  poster:
    "https://images.unsplash.com/photo-1547036967-23d11aeea016?w=1920&q=80",
};
