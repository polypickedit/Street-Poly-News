
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: number
          title: string
          subtitle: string | null
          youtube_id: string | null
          thumbnail_url: string | null
          body_content: string | null
          content_type: "video" | "article" | "gallery"
          is_featured: boolean
          is_breaking: boolean
          view_count: number | null
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          subtitle?: string | null
          youtube_id?: string | null
          thumbnail_url?: string | null
          body_content?: string | null
          content_type?: "video" | "article" | "gallery"
          is_featured?: boolean
          is_breaking?: boolean
          view_count?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          subtitle?: string | null
          youtube_id?: string | null
          thumbnail_url?: string | null
          body_content?: string | null
          content_type?: "video" | "article" | "gallery"
          is_featured?: boolean
          is_breaking?: boolean
          view_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      content_placements: {
        Row: {
          id: string
          slot_key: string
          content_type: "video" | "article" | "ad" | "gallery"
          content_id: string | null
          priority: number
          starts_at: string | null
          ends_at: string | null
          device_scope: "all" | "mobile" | "desktop"
          metadata: Json
          active: boolean
          updated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slot_key: string
          content_type: "video" | "article" | "ad" | "gallery"
          content_id?: string | null
          priority?: number
          starts_at?: string | null
          ends_at?: string | null
          device_scope?: "all" | "mobile" | "desktop"
          metadata?: Json
          active?: boolean
          updated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slot_key?: string
          content_type?: "video" | "article" | "ad" | "gallery"
          content_id?: string | null
          priority?: number
          starts_at?: string | null
          ends_at?: string | null
          device_scope?: "all" | "mobile" | "desktop"
          metadata?: Json
          active?: boolean
          updated_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          id: string
          name: string
          slug: string
          image_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          image_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          image_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Relationships: []
      }
      post_categories: {
        Row: {
          post_id: number
          category_id: string
        }
        Insert: {
          post_id: number
          category_id: string
        }
        Update: {
          post_id?: number
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      post_people: {
        Row: {
          post_id: number
          person_id: string
        }
        Insert: {
          post_id: number
          person_id: string
        }
        Update: {
          post_id?: number
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_people_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_people_person_id_fkey"
            columns: ["person_id"]
            referencedRelation: "people"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      artists: {
        Row: {
          id: string
          name: string
          email: string
          user_id: string | null
          country: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          user_id?: string | null
          country?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          user_id?: string | null
          country?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: string
          user_id: string | null
          artist_id: string
          account_id: string | null
          slot_id: string | null
          track_title: string
          artist_name: string
          spotify_track_url: string
          release_date: string
          genre: string
          mood: string
          bpm: number | null
          status: string
          payment_status: string
          payment_type: string | null
          credits_consumed: number | null
          notes_internal: string | null
          feedback_artist: string | null
          distribution_targets: Json | null
          content_bundle: Json | null
          created_at: string
          reviewed_at: string | null
          submission_type: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          artist_id: string
          account_id?: string | null
          slot_id?: string | null
          track_title: string
          artist_name: string
          spotify_track_url: string
          release_date: string
          genre: string
          mood: string
          bpm?: number | null
          status?: string
          payment_status?: string
          payment_type?: string | null
          credits_consumed?: number | null
          notes_internal?: string | null
          feedback_artist?: string | null
          distribution_targets?: Json | null
          content_bundle?: Json | null
          created_at?: string
          reviewed_at?: string | null
          submission_type?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          artist_id?: string
          account_id?: string | null
          slot_id?: string | null
          track_title?: string
          artist_name?: string
          spotify_track_url?: string
          release_date?: string
          genre?: string
          mood?: string
          bpm?: number | null
          status?: string
          payment_status?: string
          payment_type?: string | null
          credits_consumed?: number | null
          notes_internal?: string | null
          feedback_artist?: string | null
          distribution_targets?: Json | null
          content_bundle?: Json | null
          created_at?: string
          reviewed_at?: string | null
          submission_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_slot_id_fkey"
            columns: ["slot_id"]
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      playlists: {
        Row: {
          id: string
          name: string
          spotify_playlist_url: string
          primary_genre: string
          primary_mood: string
          max_tracks: number | null
          ideal_bpm_min: number | null
          ideal_bpm_max: number | null
          follower_count_snapshot: number | null
          active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          spotify_playlist_url: string
          primary_genre: string
          primary_mood: string
          max_tracks?: number | null
          ideal_bpm_min?: number | null
          ideal_bpm_max?: number | null
          follower_count_snapshot?: number | null
          active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          spotify_playlist_url?: string
          primary_genre?: string
          primary_mood?: string
          max_tracks?: number | null
          ideal_bpm_min?: number | null
          ideal_bpm_max?: number | null
          follower_count_snapshot?: number | null
          active?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      placements: {
        Row: {
          id: string
          submission_id: string
          playlist_id: string
          start_date: string
          end_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          playlist_id: string
          start_date: string
          end_date: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          playlist_id?: string
          start_date?: string
          end_date?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placements_submission_id_fkey"
            columns: ["submission_id"]
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_playlist_id_fkey"
            columns: ["playlist_id"]
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          submission_id: string
          stripe_payment_intent_id: string
          amount_cents: number
          currency: string
          status: string
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          submission_id: string
          stripe_payment_intent_id: string
          amount_cents: number
          currency?: string
          status: string
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          submission_id?: string
          stripe_payment_intent_id?: string
          amount_cents?: number
          currency?: string
          status?: string
          created_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          }
        ]
      }
      credit_packs: {
        Row: {
          id: string
          name: string
          description: string | null
          credit_amount: number
          price_cents: number
          active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          credit_amount: number
          price_cents: number
          active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          credit_amount?: number
          price_cents?: number
          active?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          name: string
          type: string
          owner_user_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          owner_user_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          owner_user_id?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      account_members: {
        Row: {
          account_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          account_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          account_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_members_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      account_ledger: {
        Row: {
          id: string
          account_id: string
          amount: number
          description: string | null
          transaction_type: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          account_id: string
          amount: number
          description?: string | null
          transaction_type: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          amount?: number
          description?: string | null
          transaction_type?: string
          reference_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_ledger_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_actions: {
        Row: {
          id: string
          admin_user_id: string
          action_type: string
          target_type: string
          target_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action_type: string
          target_type: string
          target_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action_type?: string
          target_type?: string
          target_id?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_capabilities: {
        Row: {
          id: string
          user_id: string
          capability: string
          granted_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          capability: string
          granted_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          capability?: string
          granted_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_capabilities_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      stripe_customers: {
        Row: {
          account_id: string
          stripe_customer_id: string
          created_at: string
        }
        Insert: {
          account_id: string
          stripe_customer_id: string
          created_at?: string
        }
        Update: {
          account_id?: string
          stripe_customer_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      billing_plans: {
        Row: {
          code: string
          name: string
          price_cents: number
          interval: string
          description: string | null
          active: boolean
        }
        Insert: {
          code: string
          name: string
          price_cents: number
          interval: string
          description?: string | null
          active?: boolean
        }
        Update: {
          code?: string
          name?: string
          price_cents?: number
          interval?: string
          description?: string | null
          active?: boolean
        }
        Relationships: []
      }
      account_billing: {
        Row: {
          account_id: string
          billing_plan_code: string
          next_charge_at: string
          status: string
          created_at: string
        }
        Insert: {
          account_id: string
          billing_plan_code: string
          next_charge_at: string
          status: string
          created_at?: string
        }
        Update: {
          account_id?: string
          billing_plan_code?: string
          next_charge_at?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_billing_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_billing_billing_plan_code_fkey"
            columns: ["billing_plan_code"]
            referencedRelation: "billing_plans"
            referencedColumns: ["code"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          account_id: string
          period_start: string
          period_end: string
          total_cents: number
          status: string
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          account_id: string
          period_start: string
          period_end: string
          total_cents: number
          status: string
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          period_start?: string
          period_end?: string
          total_cents?: number
          status?: string
          pdf_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      slots: {
        Row: {
          id: string
          name: string
          slug: string
          price: number
          is_active: boolean
          display_category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price: number
          is_active?: boolean
          display_category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          price?: number
          is_active?: boolean
          display_category?: string | null
          created_at?: string
        }
        Relationships: []
      }
      media_outlets: {
        Row: {
          id: string
          name: string
          price_cents: number
          outlet_type: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price_cents: number
          outlet_type: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price_cents?: number
          outlet_type?: string
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      submission_distribution: {
        Row: {
          id: string
          submission_id: string
          outlet_id: string
          status: string
          published_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          outlet_id: string
          status?: string
          published_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          outlet_id?: string
          status?: string
          published_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_distribution_submission_id_fkey"
            columns: ["submission_id"]
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_distribution_outlet_id_fkey"
            columns: ["outlet_id"]
            referencedRelation: "media_outlets"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_or_editor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      consume_capability: {
        Args: {
          p_user_id: string
          p_capability: string
        }
        Returns: boolean
      }
      has_capability: {
        Args: {
          p_user_id: string
          p_capability: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
