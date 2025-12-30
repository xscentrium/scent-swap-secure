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
        ]
      }
      collection_items: {
        Row: {
          brand: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          notes: string | null
          profile_id: string
          size: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          profile_id: string
          size?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          profile_id?: string
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "creator_subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_fragrances: {
        Row: {
          created_at: string
          fragrance_brand: string
          fragrance_name: string
          id: string
          image_url: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string
          fragrance_brand: string
          fragrance_name: string
          id?: string
          image_url?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string
          fragrance_brand?: string
          fragrance_name?: string
          id?: string
          image_url?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_fragrances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
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
        ]
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
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          id: string
          image_url: string | null
          name: string
          notes: string | null
          profile_id: string
          size_ml: number
          type: string
        }
        Insert: {
          acquired_date?: string | null
          acquired_from?: string | null
          brand: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          profile_id: string
          size_ml: number
          type?: string
        }
        Update: {
          acquired_date?: string | null
          acquired_from?: string | null
          brand?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          profile_id?: string
          size_ml?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_decants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "trade_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      trades: {
        Row: {
          created_at: string
          escrow_amount_initiator: number | null
          escrow_amount_receiver: number | null
          id: string
          initiator_confirmed: boolean | null
          initiator_id: string
          initiator_listing_id: string
          receiver_confirmed: boolean | null
          receiver_id: string
          receiver_listing_id: string | null
          status: Database["public"]["Enums"]["trade_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          escrow_amount_initiator?: number | null
          escrow_amount_receiver?: number | null
          id?: string
          initiator_confirmed?: boolean | null
          initiator_id: string
          initiator_listing_id: string
          receiver_confirmed?: boolean | null
          receiver_id: string
          receiver_listing_id?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          escrow_amount_initiator?: number | null
          escrow_amount_receiver?: number | null
          id?: string
          initiator_confirmed?: boolean | null
          initiator_id?: string
          initiator_listing_id?: string
          receiver_confirmed?: boolean | null
          receiver_id?: string
          receiver_listing_id?: string | null
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
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_trust_score: {
        Args: { p_profile_id: string }
        Returns: undefined
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
