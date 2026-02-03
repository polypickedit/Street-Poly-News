export type ContentType = 'video' | 'article' | 'ad' | 'gallery';

export interface ContentPlacement {
  id: string;
  slot_key: string;
  content_type: ContentType;
  content_id: string | null;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  device_scope: 'all' | 'mobile' | 'desktop';
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: string;
}

export interface SlotContract {
  id: string;
  accepts: ContentType[];
  description?: string;
}
