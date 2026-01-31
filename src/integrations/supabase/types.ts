export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_link_id: string
          clicked_at: string
          id: string
          ip_hash: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_link_id: string
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_link_id?: string
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          campaign: string | null
          click_count: number
          created_at: string
          destination_url: string
          id: string
          name: string
          source: string | null
          updated_at: string
        }
        Insert: {
          campaign?: string | null
          click_count?: number
          created_at?: string
          destination_url: string
          id?: string
          name: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          campaign?: string | null
          click_count?: number
          created_at?: string
          destination_url?: string
          id?: string
          name?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          country: string | null
          created_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          id: string
          status: string
          stripe_payment_intent_id: string
          submission_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          id?: string
          status: string
          stripe_payment_intent_id: string
          submission_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      placements: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          playlist_id: string
          start_date: string
          submission_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          playlist_id: string
          start_date: string
          submission_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          playlist_id?: string
          start_date?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placements_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          active: boolean | null
          created_at: string | null
          follower_count_snapshot: number | null
          id: string
          ideal_bpm_max: number | null
          ideal_bpm_min: number | null
          max_tracks: number | null
          name: string
          primary_genre: string
          primary_mood: string
          spotify_playlist_url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          follower_count_snapshot?: number | null
          id?: string
          ideal_bpm_max?: number | null
          ideal_bpm_min?: number | null
          max_tracks?: number | null
          name: string
          primary_genre: string
          primary_mood: string
          spotify_playlist_url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          follower_count_snapshot?: number | null
          id?: string
          ideal_bpm_max?: number | null
          ideal_bpm_min?: number | null
          max_tracks?: number | null
          name?: string
          primary_genre?: string
          primary_mood?: string
          spotify_playlist_url?: string
        }
        Relationships: []
      }
      post_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          post_id: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          post_id: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_people: {
        Row: {
          created_at: string
          id: string
          person_id: string
          post_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          person_id: string
          post_id: number
        }
        Update: {
          created_at?: string
          id?: string
          person_id?: string
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_people_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body_content: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          id: number
          is_breaking: boolean | null
          is_featured: boolean | null
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          view_count: number | null
          youtube_id: string
        }
        Insert: {
          body_content?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          id?: number
          is_breaking?: boolean | null
          is_featured?: boolean | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          view_count?: number | null
          youtube_id: string
        }
        Update: {
          body_content?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          id?: number
          is_breaking?: boolean | null
          is_featured?: boolean | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          view_count?: number | null
          youtube_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      slot_entitlements: {
        Row: {
          expires_at: string | null
          granted_at: string
          id: string
          is_active: boolean
          slot_id: string
          source: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean
          slot_id: string
          source: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean
          slot_id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_entitlements_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          billing_interval: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monetization_model: Database["public"]["Enums"]["monetization_model"]
          name: string
          price: number | null
          slot_type: Database["public"]["Enums"]["slot_type"]
          slug: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monetization_model?: Database["public"]["Enums"]["monetization_model"]
          name: string
          price?: number | null
          slot_type?: Database["public"]["Enums"]["slot_type"]
          slug: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monetization_model?: Database["public"]["Enums"]["monetization_model"]
          name?: string
          price?: number | null
          slot_type?: Database["public"]["Enums"]["slot_type"]
          slug?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: []
      }
      submissions: {
        Row: {
          artist_id: string
          artist_name: string
          bpm: number | null
          created_at: string | null
          feedback_artist: string | null
          genre: string
          id: string
          mood: string
          notes_internal: string | null
          payment_status: string
          release_date: string
          reviewed_at: string | null
          spotify_track_url: string
          status: string
          track_title: string
        }
        Insert: {
          artist_id: string
          artist_name: string
          bpm?: number | null
          created_at?: string | null
          feedback_artist?: string | null
          genre: string
          id?: string
          mood: string
          notes_internal?: string | null
          payment_status?: string
          release_date: string
          reviewed_at?: string | null
          spotify_track_url: string
          status?: string
          track_title: string
        }
        Update: {
          artist_id?: string
          artist_name?: string
          bpm?: number | null
          created_at?: string | null
          feedback_artist?: string | null
          genre?: string
          id?: string
          mood?: string
          notes_internal?: string | null
          payment_status?: string
          release_date?: string
          reviewed_at?: string | null
          spotify_track_url?: string
          status?: string
          track_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_or_editor: { Args: never; Returns: boolean }
    }
    Enums: {
      content_type: "video" | "article" | "gallery"
      monetization_model:
        | "free"
        | "subscription"
        | "one_time"
        | "per_item"
        | "invite_only"
      slot_type: "content" | "event" | "service" | "hybrid"
      visibility_type: "public" | "account" | "paid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_type: ["video", "article", "gallery"],
      monetization_model: [
        "free",
        "subscription",
        "one_time",
        "per_item",
        "invite_only",
      ],
      slot_type: ["content", "event", "service", "hybrid"],
      visibility_type: ["public", "account", "paid"],
    },
  },
} as const
