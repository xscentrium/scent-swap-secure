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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          profile_id: string
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          profile_id: string
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_alert_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_alert_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_alert_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_url: string
          brand: string
          created_at: string | null
          description: string | null
          fragrance_name: string
          id: string
          profile_id: string
        }
        Insert: {
          affiliate_url: string
          brand: string
          created_at?: string | null
          description?: string | null
          fragrance_name: string
          id?: string
          profile_id: string
        }
        Update: {
          affiliate_url?: string
          brand?: string
          created_at?: string | null
          description?: string | null
          fragrance_name?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          brand: string
          created_at: string
          fragrance_id: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          portfolio: string
          profile_id: string
          size: string | null
          variant_id: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          fragrance_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          portfolio?: string
          profile_id: string
          size?: string | null
          variant_id?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          fragrance_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          portfolio?: string
          profile_id?: string
          size?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "fragrance_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_subscriptions: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          actor_user_id: string | null
          created_at: string
          error_message: string | null
          id: string
          path: string
          trade_id: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          path: string
          trade_id: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          path?: string
          trade_id?: string
        }
        Relationships: []
      }
      escrow_events: {
        Row: {
          actor_profile_id: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          metadata: Json | null
          to_status: string | null
          trade_id: string
        }
        Insert: {
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          to_status?: string | null
          trade_id: string
        }
        Update: {
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          to_status?: string | null
          trade_id?: string
        }
        Relationships: []
      }
      favorite_fragrances: {
        Row: {
          created_at: string
          fragrance_brand: string
          fragrance_id: string | null
          fragrance_name: string
          id: string
          image_url: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string
          fragrance_brand: string
          fragrance_id?: string | null
          fragrance_name: string
          id?: string
          image_url?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string
          fragrance_brand?: string
          fragrance_id?: string | null
          fragrance_name?: string
          id?: string
          image_url?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_fragrances_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_fragrances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_fragrances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_reply_id: string | null
          profile_id: string
          thread_id: string
          upvotes: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          profile_id: string
          thread_id: string
          upvotes?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          profile_id?: string
          thread_id?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      forum_threads: {
        Row: {
          body: string
          category_id: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_activity_at: string
          profile_id: string
          reply_count: number
          title: string
          updated_at: string
          upvotes: number
          view_count: number
        }
        Insert: {
          body: string
          category_id: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          profile_id: string
          reply_count?: number
          title: string
          updated_at?: string
          upvotes?: number
          view_count?: number
        }
        Update: {
          body?: string
          category_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          profile_id?: string
          reply_count?: number
          title?: string
          updated_at?: string
          upvotes?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          target_id: string
          target_type: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          target_id: string
          target_type: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          target_id?: string
          target_type?: string
          value?: number
        }
        Relationships: []
      }
      fragrance_accords: {
        Row: {
          accord: string
          fragrance_id: string
          id: string
          strength: number
        }
        Insert: {
          accord: string
          fragrance_id: string
          id?: string
          strength?: number
        }
        Update: {
          accord?: string
          fragrance_id?: string
          id?: string
          strength?: number
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_accords_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_notes: {
        Row: {
          fragrance_id: string
          id: string
          layer: string
          note: string
          position: number | null
        }
        Insert: {
          fragrance_id: string
          id?: string
          layer: string
          note: string
          position?: number | null
        }
        Update: {
          fragrance_id?: string
          id?: string
          layer?: string
          note?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_notes_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_price_history: {
        Row: {
          condition: string
          created_at: string
          fragrance_brand: string
          fragrance_name: string
          id: string
          listing_id: string | null
          price: number
          reported_by: string | null
          size: string
          source: string | null
        }
        Insert: {
          condition?: string
          created_at?: string
          fragrance_brand: string
          fragrance_name: string
          id?: string
          listing_id?: string | null
          price: number
          reported_by?: string | null
          size: string
          source?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          fragrance_brand?: string
          fragrance_name?: string
          id?: string
          listing_id?: string | null
          price?: number
          reported_by?: string | null
          size?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fragrance_price_history_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fragrance_price_history_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_reviews: {
        Row: {
          cons: string[] | null
          created_at: string
          fragrance_brand: string
          fragrance_name: string
          id: string
          longevity_rating: number | null
          occasion_preferences: string[] | null
          overall_rating: number
          profile_id: string
          pros: string[] | null
          review_text: string | null
          season_preferences: string[] | null
          sillage_rating: number | null
          updated_at: string
          value_rating: number | null
        }
        Insert: {
          cons?: string[] | null
          created_at?: string
          fragrance_brand: string
          fragrance_name: string
          id?: string
          longevity_rating?: number | null
          occasion_preferences?: string[] | null
          overall_rating: number
          profile_id: string
          pros?: string[] | null
          review_text?: string | null
          season_preferences?: string[] | null
          sillage_rating?: number | null
          updated_at?: string
          value_rating?: number | null
        }
        Update: {
          cons?: string[] | null
          created_at?: string
          fragrance_brand?: string
          fragrance_name?: string
          id?: string
          longevity_rating?: number | null
          occasion_preferences?: string[] | null
          overall_rating?: number
          profile_id?: string
          pros?: string[] | null
          review_text?: string | null
          season_preferences?: string[] | null
          sillage_rating?: number | null
          updated_at?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fragrance_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_season_votes: {
        Row: {
          created_at: string
          fragrance_id: string
          id: string
          profile_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          fragrance_id: string
          id?: string
          profile_id: string
          tag: string
        }
        Update: {
          created_at?: string
          fragrance_id?: string
          id?: string
          profile_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_season_votes_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_suggestions: {
        Row: {
          brand: string
          created_at: string
          id: string
          name: string
          notes: string | null
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          year: number | null
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          year?: number | null
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          year?: number | null
        }
        Relationships: []
      }
      fragrance_user_ratings: {
        Row: {
          created_at: string
          fragrance_id: string
          id: string
          profile_id: string
          rating: string
        }
        Insert: {
          created_at?: string
          fragrance_id: string
          id?: string
          profile_id: string
          rating: string
        }
        Update: {
          created_at?: string
          fragrance_id?: string
          id?: string
          profile_id?: string
          rating?: string
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_user_ratings_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_variants: {
        Row: {
          barcode: string | null
          batch_year: number | null
          concentration: string
          created_at: string
          fragrance_id: string
          id: string
          size_ml: number
        }
        Insert: {
          barcode?: string | null
          batch_year?: number | null
          concentration?: string
          created_at?: string
          fragrance_id: string
          id?: string
          size_ml: number
        }
        Update: {
          barcode?: string | null
          batch_year?: number | null
          concentration?: string
          created_at?: string
          fragrance_id?: string
          id?: string
          size_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_variants_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrances: {
        Row: {
          approved: boolean
          brand: string
          created_at: string
          description: string | null
          gender: string | null
          id: string
          image_url: string | null
          name: string
          perfumer: string | null
          slug: string | null
          source: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          approved?: boolean
          brand: string
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name: string
          perfumer?: string | null
          slug?: string | null
          source?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          approved?: boolean
          brand?: string
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          name?: string
          perfumer?: string | null
          slug?: string | null
          source?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      influencer_content: {
        Row: {
          created_at: string | null
          embed_url: string
          id: string
          platform: string
          profile_id: string
          thumbnail_url: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          embed_url: string
          id?: string
          platform: string
          profile_id: string
          thumbnail_url?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          embed_url?: string
          id?: string
          platform?: string
          profile_id?: string
          thumbnail_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_content_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_content_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_authenticity_flags: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string | null
          vote: string
          voter_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason?: string | null
          vote: string
          voter_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string | null
          vote?: string
          voter_profile_id?: string
        }
        Relationships: []
      }
      listing_batch_codes: {
        Row: {
          ai_explanation: string | null
          ai_plausibility_score: number | null
          ai_verdict: string | null
          batch_code: string
          created_at: string
          decoded_factory: string | null
          decoded_year: number | null
          id: string
          listing_id: string
          owner_profile_id: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          ai_explanation?: string | null
          ai_plausibility_score?: number | null
          ai_verdict?: string | null
          batch_code: string
          created_at?: string
          decoded_factory?: string | null
          decoded_year?: number | null
          id?: string
          listing_id: string
          owner_profile_id: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          ai_explanation?: string | null
          ai_plausibility_score?: number | null
          ai_verdict?: string | null
          batch_code?: string
          created_at?: string
          decoded_factory?: string | null
          decoded_year?: number | null
          id?: string
          listing_id?: string
          owner_profile_id?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      listing_image_verifications: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          last_checked_at: string
          listing_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          last_checked_at?: string
          listing_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          last_checked_at?: string
          listing_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_image_verifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          brand: string
          condition: Database["public"]["Enums"]["fragrance_condition"]
          created_at: string | null
          description: string | null
          estimated_value: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          name: string
          owner_id: string
          price: number | null
          size: string
          updated_at: string | null
        }
        Insert: {
          brand: string
          condition?: Database["public"]["Enums"]["fragrance_condition"]
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          name: string
          owner_id: string
          price?: number | null
          size: string
          updated_at?: string | null
        }
        Update: {
          brand?: string
          condition?: Database["public"]["Enums"]["fragrance_condition"]
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          name?: string
          owner_id?: string
          price?: number | null
          size?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_ai_curated: boolean
          published_at: string
          source: string
          source_url: string
          summary: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_ai_curated?: boolean
          published_at?: string
          source: string
          source_url: string
          summary?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_ai_curated?: boolean
          published_at?: string
          source?: string
          source_url?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          badge_earned: boolean
          created_at: string
          email_digest_enabled: boolean
          email_digest_frequency: string
          fragrance_reviews: boolean
          id: string
          last_digest_sent_at: string | null
          profile_id: string
          push_enabled: boolean
          trade_matches: boolean
          trade_messages: boolean
          trade_proposals: boolean
          updated_at: string
        }
        Insert: {
          badge_earned?: boolean
          created_at?: string
          email_digest_enabled?: boolean
          email_digest_frequency?: string
          fragrance_reviews?: boolean
          id?: string
          last_digest_sent_at?: string | null
          profile_id: string
          push_enabled?: boolean
          trade_matches?: boolean
          trade_messages?: boolean
          trade_proposals?: boolean
          updated_at?: string
        }
        Update: {
          badge_earned?: boolean
          created_at?: string
          email_digest_enabled?: boolean
          email_digest_frequency?: string
          fragrance_reviews?: boolean
          id?: string
          last_digest_sent_at?: string | null
          profile_id?: string
          push_enabled?: boolean
          trade_matches?: boolean
          trade_messages?: boolean
          trade_proposals?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          profile_id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          profile_id: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          profile_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          post_id: string
          post_type: string
          profile_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          post_id: string
          post_type: string
          profile_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
          post_type?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          post_type: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          post_type: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          post_type?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string | null
          display_name: string | null
          email_verified: boolean | null
          facebook_url: string | null
          facebook_verified: boolean | null
          guardian_id: string | null
          guardian_verified: boolean | null
          id: string
          id_document_url: string | null
          id_submitted_at: string | null
          id_verification_status: string | null
          id_verified: boolean | null
          instagram_url: string | null
          instagram_verified: boolean | null
          is_influencer: boolean | null
          referral_code: string | null
          referred_by: string | null
          scent_preferences: Json | null
          tiktok_url: string | null
          tiktok_verified: boolean | null
          trade_matches_enabled: boolean | null
          twitter_url: string | null
          twitter_verified: boolean | null
          updated_at: string | null
          user_id: string
          username: string
          username_last_changed_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email_verified?: boolean | null
          facebook_url?: string | null
          facebook_verified?: boolean | null
          guardian_id?: string | null
          guardian_verified?: boolean | null
          id?: string
          id_document_url?: string | null
          id_submitted_at?: string | null
          id_verification_status?: string | null
          id_verified?: boolean | null
          instagram_url?: string | null
          instagram_verified?: boolean | null
          is_influencer?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          scent_preferences?: Json | null
          tiktok_url?: string | null
          tiktok_verified?: boolean | null
          trade_matches_enabled?: boolean | null
          twitter_url?: string | null
          twitter_verified?: boolean | null
          updated_at?: string | null
          user_id: string
          username: string
          username_last_changed_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email_verified?: boolean | null
          facebook_url?: string | null
          facebook_verified?: boolean | null
          guardian_id?: string | null
          guardian_verified?: boolean | null
          id?: string
          id_document_url?: string | null
          id_submitted_at?: string | null
          id_verification_status?: string | null
          id_verified?: boolean | null
          instagram_url?: string | null
          instagram_verified?: boolean | null
          is_influencer?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          scent_preferences?: Json | null
          tiktok_url?: string | null
          tiktok_verified?: boolean | null
          trade_matches_enabled?: boolean | null
          twitter_url?: string | null
          twitter_verified?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string
          username_last_changed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      samples_decants: {
        Row: {
          acquired_date: string | null
          acquired_from: string | null
          brand: string
          created_at: string
          fragrance_id: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          profile_id: string
          size_ml: number
          type: string
          variant_id: string | null
        }
        Insert: {
          acquired_date?: string | null
          acquired_from?: string | null
          brand: string
          created_at?: string
          fragrance_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          profile_id: string
          size_ml: number
          type?: string
          variant_id?: string | null
        }
        Update: {
          acquired_date?: string | null
          acquired_from?: string | null
          brand?: string
          created_at?: string
          fragrance_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          profile_id?: string
          size_ml?: number
          type?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "samples_decants_fragrance_id_fkey"
            columns: ["fragrance_id"]
            isOneToOne: false
            referencedRelation: "fragrances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_decants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_decants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_decants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "fragrance_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      scent_logs: {
        Row: {
          created_at: string
          fragrance_brand: string
          fragrance_name: string
          id: string
          logged_date: string
          mood: string | null
          notes: string | null
          occasion: string | null
          profile_id: string
          rating: number | null
          weather: string | null
        }
        Insert: {
          created_at?: string
          fragrance_brand: string
          fragrance_name: string
          id?: string
          logged_date?: string
          mood?: string | null
          notes?: string | null
          occasion?: string | null
          profile_id: string
          rating?: number | null
          weather?: string | null
        }
        Update: {
          created_at?: string
          fragrance_brand?: string
          fragrance_name?: string
          id?: string
          logged_date?: string
          mood?: string | null
          notes?: string | null
          occasion?: string | null
          profile_id?: string
          rating?: number | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scent_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scent_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_fragrances: {
        Row: {
          created_at: string
          fragrance_brand: string
          fragrance_name: string
          id: string
          is_worn: boolean | null
          notes: string | null
          occasion: string | null
          profile_id: string
          scheduled_date: string
        }
        Insert: {
          created_at?: string
          fragrance_brand: string
          fragrance_name: string
          id?: string
          is_worn?: boolean | null
          notes?: string | null
          occasion?: string | null
          profile_id: string
          scheduled_date: string
        }
        Update: {
          created_at?: string
          fragrance_brand?: string
          fragrance_name?: string
          id?: string
          is_worn?: boolean | null
          notes?: string | null
          occasion?: string | null
          profile_id?: string
          scheduled_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_fragrances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_fragrances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          created_at: string
          filter_type: string
          id: string
          profile_id: string | null
          query: string
          results_count: number
        }
        Insert: {
          created_at?: string
          filter_type?: string
          id?: string
          profile_id?: string | null
          query: string
          results_count?: number
        }
        Update: {
          created_at?: string
          filter_type?: string
          id?: string
          profile_id?: string | null
          query?: string
          results_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          profile_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          profile_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          profile_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_tags: {
        Row: {
          tag_id: string
          thread_id: string
        }
        Insert: {
          tag_id: string
          thread_id: string
        }
        Update: {
          tag_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "forum_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_tags_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          trade_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          trade_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_messages_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_preferences: {
        Row: {
          avoid_notes: string[] | null
          blind_match_enabled: boolean | null
          id: string
          max_value: number | null
          min_value: number | null
          preferred_brands: string[] | null
          preferred_notes: string[] | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          avoid_notes?: string[] | null
          blind_match_enabled?: boolean | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          preferred_brands?: string[] | null
          preferred_notes?: string[] | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          avoid_notes?: string[] | null
          blind_match_enabled?: boolean | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          preferred_brands?: string[] | null
          preferred_notes?: string[] | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_ratings: {
        Row: {
          accuracy_rating: number | null
          communication_rating: number | null
          created_at: string
          id: string
          packaging_rating: number | null
          rated_id: string
          rater_id: string
          rating: number
          review_text: string | null
          trade_id: string
        }
        Insert: {
          accuracy_rating?: number | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          packaging_rating?: number | null
          rated_id: string
          rater_id: string
          rating: number
          review_text?: string | null
          trade_id: string
        }
        Update: {
          accuracy_rating?: number | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          packaging_rating?: number | null
          rated_id?: string
          rater_id?: string
          rating?: number
          review_text?: string | null
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_ratings_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_shipments: {
        Row: {
          carrier: string
          created_at: string
          delivered_at: string | null
          id: string
          label_url: string | null
          notes: string | null
          recipient_profile_id: string
          sender_profile_id: string
          shipped_at: string | null
          status: string
          tracking_number: string
          tracking_url: string | null
          trade_id: string
          updated_at: string
        }
        Insert: {
          carrier: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          label_url?: string | null
          notes?: string | null
          recipient_profile_id: string
          sender_profile_id: string
          shipped_at?: string | null
          status?: string
          tracking_number: string
          tracking_url?: string | null
          trade_id: string
          updated_at?: string
        }
        Update: {
          carrier?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          label_url?: string | null
          notes?: string | null
          recipient_profile_id?: string
          sender_profile_id?: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string
          tracking_url?: string | null
          trade_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          created_at: string
          dispute_evidence_urls: string[] | null
          dispute_reason: string | null
          disputed_at: string | null
          disputed_by: string | null
          escrow_amount_initiator: number | null
          escrow_amount_receiver: number | null
          escrow_status: string
          id: string
          initiator_confirmed: boolean | null
          initiator_id: string
          initiator_listing_id: string
          initiator_received: boolean
          locked_initiator_value: number | null
          locked_receiver_value: number | null
          receiver_confirmed: boolean | null
          receiver_id: string
          receiver_listing_id: string | null
          receiver_received: boolean
          refunded_at: string | null
          released_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["trade_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispute_evidence_urls?: string[] | null
          dispute_reason?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          escrow_amount_initiator?: number | null
          escrow_amount_receiver?: number | null
          escrow_status?: string
          id?: string
          initiator_confirmed?: boolean | null
          initiator_id: string
          initiator_listing_id: string
          initiator_received?: boolean
          locked_initiator_value?: number | null
          locked_receiver_value?: number | null
          receiver_confirmed?: boolean | null
          receiver_id: string
          receiver_listing_id?: string | null
          receiver_received?: boolean
          refunded_at?: string | null
          released_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispute_evidence_urls?: string[] | null
          dispute_reason?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          escrow_amount_initiator?: number | null
          escrow_amount_receiver?: number | null
          escrow_status?: string
          id?: string
          initiator_confirmed?: boolean | null
          initiator_id?: string
          initiator_listing_id?: string
          initiator_received?: boolean
          locked_initiator_value?: number | null
          locked_receiver_value?: number | null
          receiver_confirmed?: boolean | null
          receiver_id?: string
          receiver_listing_id?: string | null
          receiver_received?: boolean
          refunded_at?: string | null
          released_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_initiator_listing_id_fkey"
            columns: ["initiator_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiver_listing_id_fkey"
            columns: ["receiver_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_scores: {
        Row: {
          average_rating: number | null
          calculated_score: number
          id: string
          last_updated: string
          profile_id: string
          total_ratings: number
          total_trades_cancelled: number
          total_trades_completed: number
          verification_bonus: number
        }
        Insert: {
          average_rating?: number | null
          calculated_score?: number
          id?: string
          last_updated?: string
          profile_id: string
          total_ratings?: number
          total_trades_cancelled?: number
          total_trades_completed?: number
          verification_bonus?: number
        }
        Update: {
          average_rating?: number | null
          calculated_score?: number
          id?: string
          last_updated?: string
          profile_id?: string
          total_ratings?: number
          total_trades_cancelled?: number
          total_trades_completed?: number
          verification_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "trust_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          profile_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          brand: string
          created_at: string
          id: string
          name: string
          notes: string | null
          priority: string | null
          profile_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          priority?: string | null
          profile_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          priority?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email_verified: boolean | null
          facebook_url: string | null
          facebook_verified: boolean | null
          id: string | null
          id_verified: boolean | null
          instagram_url: string | null
          instagram_verified: boolean | null
          is_influencer: boolean | null
          referral_code: string | null
          tiktok_url: string | null
          tiktok_verified: boolean | null
          trade_matches_enabled: boolean | null
          twitter_url: string | null
          twitter_verified: boolean | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email_verified?: boolean | null
          facebook_url?: string | null
          facebook_verified?: boolean | null
          id?: string | null
          id_verified?: boolean | null
          instagram_url?: string | null
          instagram_verified?: boolean | null
          is_influencer?: boolean | null
          referral_code?: string | null
          tiktok_url?: string | null
          tiktok_verified?: boolean | null
          trade_matches_enabled?: boolean | null
          twitter_url?: string | null
          twitter_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email_verified?: boolean | null
          facebook_url?: string | null
          facebook_verified?: boolean | null
          id?: string | null
          id_verified?: boolean | null
          instagram_url?: string | null
          instagram_verified?: boolean | null
          is_influencer?: boolean | null
          referral_code?: string | null
          tiktok_url?: string | null
          tiktok_verified?: boolean | null
          trade_matches_enabled?: boolean | null
          twitter_url?: string | null
          twitter_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_dispute_evidence_failure: {
        Args: { p_error: string; p_path: string; p_trade_id: string }
        Returns: undefined
      }
      recalculate_trust_score: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      search_fragrances: {
        Args: { lim?: number; q: string }
        Returns: {
          brand: string
          gender: string
          id: string
          image_url: string
          name: string
          year: number
        }[]
      }
      search_fragrances_by_accord: {
        Args: { accord_q: string; lim?: number }
        Returns: {
          brand: string
          id: string
          image_url: string
          name: string
          strength: number
          year: number
        }[]
      }
      search_fragrances_by_note: {
        Args: { lim?: number; note_q: string }
        Returns: {
          brand: string
          id: string
          image_url: string
          name: string
          year: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      fragrance_condition: "new" | "like_new" | "excellent" | "good" | "fair"
      listing_type: "sale" | "trade" | "both"
      trade_status:
        | "pending"
        | "accepted"
        | "escrow_held"
        | "completed"
        | "cancelled"
        | "disputed"
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
      app_role: ["admin", "moderator", "user"],
      fragrance_condition: ["new", "like_new", "excellent", "good", "fair"],
      listing_type: ["sale", "trade", "both"],
      trade_status: [
        "pending",
        "accepted",
        "escrow_held",
        "completed",
        "cancelled",
        "disputed",
      ],
    },
  },
} as const
