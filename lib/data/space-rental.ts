export const spaceRentalContent = {
  hero: {
    label: "Space Rental",
    title: "場地租借",
    badges: ["📍 桃園市中壢區三和二街 10 號 2 樓｜中原夜市商圈"],
    subtitle: "二階藝術空間",
    description:
      "提供排練、藝術課程、工作坊、講座及各類創作活動租借使用。",
  },
  about: {
    label: "About",
    title: "空間特色",
    paragraphs: [
      "二階藝術空間位於中原夜市商圈，交通便利，適合課程、排練、工作坊、講座及各類小型活動使用。",
      "空間約 7.5 坪（約 24.9 平方公尺），可依活動需求自由配置，提供舒適且彈性的使用環境。",
    ],
    featureItems: [
      {
        id: "location",
        title: "中原夜市商圈",
        description: "交通便利，生活機能完善。",
        icon: "location" as const,
      },
      {
        id: "flexible",
        title: "彈性空間",
        description: "可依不同活動需求自由配置。",
        icon: "flexible" as const,
      },
      {
        id: "ac",
        title: "冷氣空調",
        description: "提供舒適的室內環境。",
        icon: "ac" as const,
      },
      {
        id: "parking",
        title: "附近停車場",
        description: "開車前往方便，周邊設有停車空間。",
        icon: "parking" as const,
      },
    ],
  },
  usage: {
    label: "Usage",
    title: "適合用途",
    description:
      "無論是教學、排練、創作或聚會，二階藝術空間都能提供舒適且彈性的使用環境。",
  },
  usageItems: [
    {
      id: "drama",
      title: "戲劇排練",
      description: "適合戲劇、舞台演出與排練使用。",
      icon: "drama" as const,
    },
    {
      id: "dance",
      title: "舞蹈練習",
      description: "適合街舞、現代舞、律動及排舞課程。",
      icon: "dance" as const,
    },
    {
      id: "magic",
      title: "魔術排練",
      description: "適合魔術演出彩排、練習與交流活動。",
      icon: "magic" as const,
    },
    {
      id: "yoga",
      title: "瑜伽・伸展課程",
      description: "適合瑜伽、伸展、冥想及身心放鬆課程。",
      icon: "yoga" as const,
    },
    {
      id: "class",
      title: "小班課程",
      description: "適合語言課、家教、美術課、音樂課等教學。",
      icon: "class" as const,
    },
    {
      id: "workshop",
      title: "工作坊",
      description: "適合手作課程、藝術創作、親子活動及體驗課。",
      icon: "workshop" as const,
    },
    {
      id: "photo",
      title: "攝影・錄影",
      description: "適合商品拍攝、人物攝影、影片錄製與直播。",
      icon: "photo" as const,
    },
    {
      id: "performance",
      title: "講座・分享會・小型演出",
      description: "適合講座、讀書會、魔術沙龍、小型發表會等活動。",
      icon: "performance" as const,
    },
    {
      id: "boardgames",
      title: "桌遊聚會",
      description: "適合桌遊、劇本殺、小型聚會及休閒交流活動。",
      icon: "boardgames" as const,
    },
    {
      id: "community",
      title: "社群交流・讀書會",
      description: "適合讀書會、創業交流、社群聚會及企業小型內訓。",
      icon: "community" as const,
    },
  ],
  gallery: {
    label: "Gallery",
    title: "空間照片",
    description: "實際空間環境一覽，歡迎預約參觀。",
    images: [
      {
        src: "/images/space/space-1.jpg",
        alt: "二階藝術空間照片 1",
      },
      {
        src: "/images/space/space-2.jpg",
        alt: "二階藝術空間照片 2",
      },
      {
        src: "/images/space/space-3.jpg",
        alt: "二階藝術空間照片 3",
      },
      {
        src: "/images/space/space-4.jpg",
        alt: "二階藝術空間照片 4",
      },
    ],
  },
  pricing: {
    label: "Pricing",
    title: "租借價格",
    description: "依活動性質提供不同方案，歡迎選擇最符合需求的租借方式。",
    timeSlotsTitle: "租借時段",
    timeSlots: [
      { id: "a", label: "A 時段", time: "10:00－14:00" },
      { id: "b", label: "B 時段", time: "14:00－18:00" },
      { id: "c", label: "C 時段", time: "18:00－22:00" },
      { id: "full", label: "全日", time: "10:00－22:00" },
    ],
    plans: [
      {
        id: "cultural-non-fee",
        title: "藝文團體（非場地收費活動）",
        audience: "學生、排練",
        weekday: { slot: 450, full: 1200, hourly: 150 },
        holiday: { slot: 550, full: 1500, hourly: 180 },
      },
      {
        id: "cultural-fee",
        title: "藝文團體（場地收費活動）",
        audience: "工作坊、講座、收費課程",
        weekday: { slot: 600, full: 1800, hourly: 200 },
        holiday: { slot: 800, full: 2200, hourly: 250 },
      },
      {
        id: "corporate",
        title: "公司行號",
        audience: "教育訓練、會議、品牌活動",
        weekday: { slot: 1300, full: 3600, hourly: 350 },
        holiday: { slot: 2000, full: 4500, hourly: 550 },
      },
    ],
    hourlyPricingLabel: "小時計費（最低租借 2 小時）",
    promoNotice: {
      title: "🎉 試營運優惠",
      description:
        "以上為試營運優惠價格，長期租借、固定開課或包場合作，歡迎聯繫洽詢專案優惠。",
    },
    rentalNotice: {
      title: "📌 租借說明",
      items: [
        "小時計費最低租借 2 小時。",
        "不足 1 小時以 1 小時計算。",
        "小時計費須依當日場地空檔安排。",
        "實際可租借時段請以 Google 行事曆及工作人員確認為準。",
      ],
    },
  },
  calendar: {
    label: "Availability",
    title: "可租借時段",
    description:
      "下方為目前場地使用情況，若該時段顯示已有活動，表示已安排使用。若未顯示活動，仍請透過下方表單與我們確認是否可租借。",
    disclaimer: "行事曆僅供參考，實際可租借時段仍以晟心誠藝劇團確認為準。",
  },
  location: {
    label: "Location",
    title: "交通位置",
    description: "位於中原夜市商圈，交通便利，歡迎預約參觀或租借。",
    addressLabel: "地址",
    address: "桃園市中壢區三和二街 10 號 2 樓",
    mapsQuery: "桃園市中壢區三和二街10號2樓",
    mapsTitle: "二階藝術空間位置",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E4%B8%89%E5%92%8C%E4%BA%8C%E8%A1%9710%E8%99%9F2%E6%A8%93&hl=zh-TW&z=17&output=embed",
    mapsNavigationUrl:
      "https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E4%B8%89%E5%92%8C%E4%BA%8C%E8%A1%9710%E8%99%9F2%E6%A8%93",
    mapsButtonLabel: "Google 地圖導航",
    contactButtonLabel: "聯絡我們",
  },
  notices: {
    label: "Notice",
    title: "租借說明",
    items: [
      {
        text: "進場、撤場及場地整理時間皆包含於租借時段內，請自行預留時間。",
        icon: "check" as const,
      },
      {
        text: "非 A／B／C 固定時段租借，依小時計費。",
        icon: "check" as const,
      },
      {
        text: "小時計費最低租借 2 小時。",
        icon: "check" as const,
      },
      {
        text: "租借未滿 1 小時，以 1 小時計費。",
        icon: "check" as const,
      },
      {
        text: "請於租借結束前完成場地復原，並攜帶個人物品離場。",
        icon: "check" as const,
      },
      {
        text: "實際可租借時段請以 Google 行事曆及工作人員確認為準。",
        icon: "info" as const,
      },
    ],
  },
  inquiry: {
    label: "Inquiry",
    title: "立即預約場地",
    description: "填寫下方租借需求，我們將確認場地檔期後，盡快與您聯繫。",
    calendarHint:
      "💡 建議先查看上方 Google 行事曆，確認欲租借時段是否為空檔，再填寫租借申請。",
    submitButtonLabel: "送出租借申請",
    submitDisclaimer:
      "送出申請不代表預約完成，實際租借將由工作人員確認檔期後與您聯繫。",
    successMessage: {
      title: "已收到您的租借申請！",
      description:
        "我們將盡快確認場地檔期，並以 Email 或電話與您聯繫，謝謝您的預約。",
    },
    timeSlotOptions: [
      { value: "a" as const, label: "A 時段（10:00–14:00）" },
      { value: "b" as const, label: "B 時段（14:00–18:00）" },
      { value: "c" as const, label: "C 時段（18:00–22:00）" },
      { value: "full" as const, label: "全日（10:00–22:00）" },
      { value: "custom" as const, label: "自訂時段" },
    ],
    customTimeSlotLabel: "自訂租借時間",
    customTimeSlotPlaceholder: "例如：14:00–16:00",
  },
  footerCta: {
    title: "想了解更多場地資訊？",
    subtitle: "立即與我們聯絡",
    buttonLabel: "詢問租借",
  },
};
