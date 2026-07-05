export type CourseClass = {
  id: string;
  name: string;
  time: string;
  capacity: number;
  full: boolean;
};

export type CourseDateOption = {
  date: string;
  dayLabel: string;
  schedule: string;
  classes: CourseClass[];
};

export type RegistrationCourse = {
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  coverImage: string;
  dates: CourseDateOption[];
};

export const courses: Record<string, RegistrationCourse> = {
  dance: {
    slug: "dance",
    title: "常態舞蹈課程",
    subtitle: "讓藝術成為生活的一部分，建立自信、律動與舞台魅力。",
    location: "二階藝術空間",
    coverImage:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80",
    dates: [
      {
        date: "2026-07-12",
        dayLabel: "7/12（六）",
        schedule: "每週六",
        classes: [
          { id: "A", name: "A班", time: "14:00–15:00", capacity: 5, full: false },
          { id: "B", name: "B班", time: "15:30–16:30", capacity: 5, full: false },
          { id: "C", name: "C班", time: "17:00–18:00", capacity: 5, full: true },
          { id: "D", name: "D班", time: "18:30–19:30", capacity: 5, full: false },
        ],
      },
      {
        date: "2026-07-19",
        dayLabel: "7/19（六）",
        schedule: "每週六",
        classes: [
          { id: "A", name: "A班", time: "14:00–15:00", capacity: 5, full: false },
          { id: "B", name: "B班", time: "15:30–16:30", capacity: 5, full: true },
          { id: "C", name: "C班", time: "17:00–18:00", capacity: 5, full: false },
          { id: "D", name: "D班", time: "18:30–19:30", capacity: 5, full: false },
        ],
      },
      {
        date: "2026-07-26",
        dayLabel: "7/26（六）",
        schedule: "每週六",
        classes: [
          { id: "A", name: "A班", time: "14:00–15:00", capacity: 5, full: false },
          { id: "B", name: "B班", time: "15:30–16:30", capacity: 5, full: false },
          { id: "C", name: "C班", time: "17:00–18:00", capacity: 5, full: false },
          { id: "D", name: "D班", time: "18:30–19:30", capacity: 5, full: false },
        ],
      },
    ],
  },
  magic: {
    slug: "magic",
    title: "常態魔術課程",
    subtitle: "從近景到舞台，用魔術開啟觀察力、創意與表演自信。",
    location: "二階藝術空間",
    coverImage:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80",
    dates: [
      {
        date: "2026-07-13",
        dayLabel: "7/13（日）",
        schedule: "每週日",
        classes: [
          { id: "A", name: "A班", time: "10:00–11:30", capacity: 8, full: false },
          { id: "B", name: "B班", time: "14:00–15:30", capacity: 8, full: false },
          { id: "C", name: "C班", time: "16:00–17:30", capacity: 8, full: false },
        ],
      },
      {
        date: "2026-07-20",
        dayLabel: "7/20（日）",
        schedule: "每週日",
        classes: [
          { id: "A", name: "A班", time: "10:00–11:30", capacity: 8, full: true },
          { id: "B", name: "B班", time: "14:00–15:30", capacity: 8, full: false },
          { id: "C", name: "C班", time: "16:00–17:30", capacity: 8, full: false },
        ],
      },
    ],
  },
  drama: {
    slug: "drama",
    title: "常態戲劇課程",
    subtitle: "透過角色與即興，鍛鍊表達、聆聽與舞台存在感。",
    location: "二階藝術空間",
    coverImage:
      "https://images.unsplash.com/photo-1507676184292-758854542ecc?w=1600&q=80",
    dates: [
      {
        date: "2026-07-14",
        dayLabel: "7/14（一）",
        schedule: "每週一",
        classes: [
          { id: "A", name: "A班", time: "16:00–17:30", capacity: 10, full: false },
          { id: "B", name: "B班", time: "18:00–19:30", capacity: 10, full: false },
        ],
      },
      {
        date: "2026-07-21",
        dayLabel: "7/21（一）",
        schedule: "每週一",
        classes: [
          { id: "A", name: "A班", time: "16:00–17:30", capacity: 10, full: false },
          { id: "B", name: "B班", time: "18:00–19:30", capacity: 10, full: true },
        ],
      },
    ],
  },
  camp: {
    slug: "camp",
    title: "2026 夏日魔法營",
    subtitle: "五天密集體驗，融合魔術、戲劇與舞蹈的跨域藝術探索。",
    location: "晟心誠藝劇團 台北工作室",
    coverImage:
      "https://images.unsplash.com/photo-1503099229945-8938207465c0?w=1600&q=80",
    dates: [
      {
        date: "2026-07-15",
        dayLabel: "7/15 — 7/19",
        schedule: "夏令營",
        classes: [
          { id: "A", name: "A組", time: "09:30–16:30", capacity: 20, full: false },
          { id: "B", name: "B組", time: "09:30–16:30", capacity: 20, full: true },
        ],
      },
    ],
  },
};

export function getCourseBySlug(slug: string): RegistrationCourse | undefined {
  return courses[slug];
}

export function getAllCourseSlugs(): string[] {
  return Object.keys(courses);
}

export function findClassById(
  course: RegistrationCourse,
  dateKey: string,
  classId: string,
): CourseClass | undefined {
  const dateOption = course.dates.find((d) => d.date === dateKey);
  return dateOption?.classes.find((c) => c.id === classId);
}

export function findDateOption(
  course: RegistrationCourse,
  dateKey: string,
): CourseDateOption | undefined {
  return course.dates.find((d) => d.date === dateKey);
}
