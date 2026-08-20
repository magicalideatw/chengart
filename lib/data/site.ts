export const siteConfig = {
  name: "晟心誠藝劇團",
  nameEn: "Cheng Art Theatre",
  tagline: "Magic × Drama × Dance",
  slogan: "讓藝術成為每個人成長的力量",
  description:
    "晟心誠藝劇團以魔術、戲劇與舞蹈為核心，提供舞台演出、藝術教育、兒童課程、活動企劃與場地空間服務，致力於讓藝術走進生活。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://chengart.tw",
  email: "chengart.theatre@gmail.com",
  facebook: "https://facebook.com/chengart.theatre",
  instagram: "https://www.instagram.com/chengart.theatre/",
  footerSlogan:
    "以魔術、戲劇、舞蹈與藝術教育，打造兼具感動、創意與教育意義的藝術體驗。",
  footerCopyright:
    "© 2026 晟心誠藝劇團 Cheng Art Theatre. All Rights Reserved.",
};

export const navLinks = [
  { label: "首頁", href: "/" },
  { label: "最新演出", href: "#latest-performances" },
  { label: "藝術課程", href: "#courses" },
  { label: "關於", href: "#about" },
  { label: "最新消息", href: "#news" },
  { label: "場地租借", href: "/space" },
  { label: "聯絡", href: "#contact" },
];

export const footerLinks = [
  { label: "最新演出", href: "#latest-performances" },
  { label: "藝術課程", href: "#courses" },
  { label: "關於", href: "#about" },
  { label: "最新消息", href: "#news" },
  { label: "聯絡", href: "#contact" },
];

export const heroImage = {
  src: "/images/hero-performance.jpg",
  alt: "晟心誠藝劇團劇場演出",
};

export const heroVideo = {
  src: "https://videos.pexels.com/video-files/3129677/3129677-uhd_2560_1440_25fps.mp4",
  poster:
    "https://images.unsplash.com/photo-1547036967-23d11aeea016?w=1920&q=80",
};
