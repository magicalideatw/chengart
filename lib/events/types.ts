import type { EventStatus, EventType } from "@/lib/events/constants";

export type EventHighlight = {
  icon: string;
  title: string;
  description: string;
};

export type EventTimelineItem = {
  session: string;
  title: string;
};

export type EventInstructor = {
  name: string;
  role: string;
  bio: string;
  avatar: string;
};

export type EventFAQ = {
  question: string;
  answer: string;
};

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
  eventType: string;
  status: EventStatus;
  startDate: string;
  endDate: string | null;
  intro: string;
  content: string;
  showOnHomepage: boolean;
  isFeatured: boolean;
  sortOrder: number;
  registrationButtonText: string;
  registrationUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventFormInput = {
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
  eventType: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  intro: string;
  content: string;
  showOnHomepage: boolean;
  isFeatured: boolean;
  sortOrder: number;
  registrationButtonText: string;
  registrationUrl: string;
};

export type EventHomepageItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: EventStatus;
  coverImage: string;
  dateLabel: string;
};

export type EventPageData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: EventStatus;
  coverImage: string;
  eventType: string;
  startDate: string;
  endDate: string | null;
  intro: string;
  content: string;
  registrationButtonText: string;
  registrationUrl: string | null;
  dateLabel: string;
  time?: string;
  location?: string;
  age?: string;
  audienceType?: "adult" | "child";
  price?: string;
  capacity?: number;
  registered?: number;
  highlights?: EventHighlight[];
  timeline?: EventTimelineItem[];
  instructors?: EventInstructor[];
  gallery?: string[];
  faq?: EventFAQ[];
};
