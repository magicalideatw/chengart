export type AnnouncementRecord = {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementFormInput = {
  title: string;
  content: string;
  isActive: boolean;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
};
