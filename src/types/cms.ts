export type ContentType = 'video' | 'article' | 'ad' | 'gallery';

export interface PlacementMetadata {
  imageUrl?: string;
  targetUrl?: string;
  altText?: string;
  backgroundColor?: string;
  title?: string;
  description?: string;
  videoId?: string;
  autoplay?: boolean;
  [key: string]: unknown;
}

export interface ContentPlacement {
  id: string;
  slot_key: string;
  content_type: ContentType;
  content_id: string | null;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  device_scope: 'all' | 'mobile' | 'desktop';
  metadata: PlacementMetadata;
  active: boolean;
  created_at: string;
}

export interface SlotContract {
  id: string;
  accepts: ContentType[];
  description?: string;
}
