export interface PlacementOrder {
  id: string;
  order_id: string;
  slot_type: string;
  outlet_id?: string | null;
  artist_name: string;
  email: string;
  release_link?: string | null;
  notes?: string | null;
  status: 'pending_paypal' | 'paid' | 'cancelled';
  payment_method: string;
  created_at: string;
  paid_at?: string | null;
  paypal_transaction_id?: string | null;
}

export interface PayPalIntakeFormData {
  slot_type: string;
  outlet_id: string;
  artist_name: string;
  email: string;
  release_link: string;
  notes: string;
}

export type PayPalEventType = 
  | 'intake_created' 
  | 'redirected_to_paypal' 
  | 'returned_from_paypal' 
  | 'marked_paid' 
  | 'rejected';

export interface PlacementOrderEvent {
  id: string;
  order_id: string;
  event_type: PayPalEventType;
  metadata?: Record<string, unknown>;
  created_at: string;
}
