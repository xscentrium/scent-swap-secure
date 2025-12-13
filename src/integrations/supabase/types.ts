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
          tiktok_url: string | null
          tiktok_verified: boolean | null
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
          tiktok_url?: string | null
          tiktok_verified?: boolean | null
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
          tiktok_url?: string | null
          tiktok_verified?: boolean | null
          twitter_url?: string | null
          twitter_verified?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string
          username_last_changed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
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
