import { Database } from "@/integrations/supabase/types";

export type ListeningSessionStatus = "draft" | "open" | "closed" | "completed";

export interface ListeningSession {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: ListeningSessionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ListeningSessionTier {
  id: string;
  session_id: string;
  tier_name: string;
  price_cents: number;
  slot_limit: number;
  slots_filled: number;
  description: string | null;
  manually_closed: boolean | null;
  created_at: string;
  remaining_slots?: number;
  sold_out?: boolean;
}

export interface ListeningSessionPurchase {
  id: string;
  session_id: string;
  tier_id: string;
  user_id: string;
  status: "pending" | "paid" | "refunded" | "failed";
  payment_id: string | null;
  stripe_session_id: string | null;
  amount_total_cents: number;
  created_at: string;
  paid_at: string | null;
}

export interface AdminListeningSessionInput {
  id?: string;
  title: string;
  description?: string | null;
  scheduled_at: string;
  status: ListeningSessionStatus;
}

export interface AdminListeningTierInput {
  id?: string;
  tier_name: string;
  price_cents: number;
  slot_limit: number;
  description?: string | null;
  manually_closed?: boolean;
}

export interface AdminListeningSessionRow extends AdminListeningSessionInput {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  tiers: ListeningSessionTier[];
}

export interface ListeningPurchase {
  id: string;
  session_id: string;
  tier_id: string;
  status: "pending" | "paid" | "refunded" | "failed";
  payment_id: string | null;
  created_at: string;
  paid_at: string | null;
  stripe_session_id?: string | null;
}

export type ExtendedDatabase = {
  public: {
    Tables: Database["public"]["Tables"] & {
      listening_sessions: {
        Row: ListeningSession;
        Insert: Omit<ListeningSession, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<ListeningSession, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      listening_session_tiers: {
        Row: ListeningSessionTier;
        Insert: Omit<ListeningSessionTier, "id" | "created_at" | "slots_filled"> & { id?: string; created_at?: string; slots_filled?: number };
        Update: Partial<Omit<ListeningSessionTier, "id" | "created_at" | "slots_filled">>;
        Relationships: [];
      };
      listening_session_purchases: {
        Row: ListeningSessionPurchase;
        Insert: Omit<ListeningSessionPurchase, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<ListeningSessionPurchase, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      create_listening_submission: {
        Args: {
          p_purchase_id: string;
          p_track_title: string;
          p_track_url: string;
        };
        Returns: string;
      };
    };
    Views: Database["public"]["Views"];
    Enums: Database["public"]["Enums"];
    CompositeTypes: Database["public"]["CompositeTypes"];
  };
};
