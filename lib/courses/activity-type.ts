export const ACTIVITY_TYPES = ["course", "performance"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const FUTURE_ACTIVITY_TYPES = ["workshop", "camp"] as const;

export type FutureActivityType = (typeof FUTURE_ACTIVITY_TYPES)[number];

export type HomeActivityType = ActivityType | FutureActivityType;

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  course: "課程",
  performance: "演出",
};

export const FUTURE_ACTIVITY_TYPE_LABELS: Record<FutureActivityType, string> = {
  workshop: "工作坊",
  camp: "夏令營",
};

export function getActivityTypeLabel(type: HomeActivityType): string {
  if (type === "workshop" || type === "camp") {
    return FUTURE_ACTIVITY_TYPE_LABELS[type];
  }
  return ACTIVITY_TYPE_LABELS[type];
}

export const HOME_ACTIVITY_SECTIONS: Record<
  HomeActivityType,
  {
    sectionId: string;
    label: string;
    title: string;
    description: string;
    emptyMessage: string;
    bgClassName: string;
    ctaLabel: string;
  }
> = {
  course: {
    sectionId: "courses",
    label: "Courses",
    title: "藝術課程",
    description:
      "探索魔術、戲劇、舞蹈等多元藝術課程，透過學習、體驗與創作，培養自信與表達能力。",
    emptyMessage: "",
    bgClassName: "bg-surface",
    ctaLabel: "立即報名",
  },
  performance: {
    sectionId: "latest-performances",
    label: "Performances",
    title: "最新演出",
    description: "欣賞晟心誠藝劇團最新製作與精彩演出。",
    emptyMessage: "",
    bgClassName: "bg-white",
    ctaLabel: "立即購票",
  },
  workshop: {
    sectionId: "workshops",
    label: "Workshops",
    title: "工作坊",
    description: "短期密集的工作坊與體驗活動。",
    emptyMessage: "目前尚無開放中的工作坊",
    bgClassName: "bg-surface",
    ctaLabel: "查看詳情",
  },
  camp: {
    sectionId: "camps",
    label: "Camps",
    title: "夏令營",
    description: "冬夏令營與假期營隊活動。",
    emptyMessage: "目前尚無開放中的營隊",
    bgClassName: "bg-white",
    ctaLabel: "查看詳情",
  },
};

export function parseActivityType(value: unknown): ActivityType {
  if (value === "course" || value === "performance") {
    return value;
  }
  return "course";
}
