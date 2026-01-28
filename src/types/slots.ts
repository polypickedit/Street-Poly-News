export type SlotType = 'content' | 'event' | 'service' | 'hybrid';
export type VisibilityType = 'public' | 'account' | 'paid';
export type MonetizationModel = 'free' | 'subscription' | 'one_time' | 'per_item' | 'invite_only';

export interface Slot {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  slot_type: SlotType;
  visibility: VisibilityType;
  monetization_model: MonetizationModel;
  price: number | null;
  billing_interval: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  id: string;
  user_id: string;
  slot_id: string;
  source: 'subscription' | 'purchase' | 'manual' | 'promo';
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface SlotAccess {
  hasAccess: boolean;
  reason?: 'unauthenticated' | 'unsubscribed' | 'inactive_slot' | 'payment_required';
  slot?: Slot;
}
